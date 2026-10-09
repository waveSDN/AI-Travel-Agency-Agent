'use strict';

/**
 * Gemini provider through the official Google GenAI SDK (@google/genai).
 * Server-side only: the key is passed here and nowhere else. No tools, no URL context,
 * no search grounding: the model answers from the system instruction's approved knowledge.
 */
const { GoogleGenAI, ApiError, ThinkingLevel } = require('@google/genai');
const { RESPONSE_SCHEMA } = require('./output');

/**
 * @typedef {'quota'|'auth'|'bad_request'|'timeout'|'unavailable'|'blocked'} ProviderFailure
 * @typedef {{ systemInstruction: string, contents: Array<{ role: 'user'|'model', parts: Array<{ text: string }> }> }} ProviderRequest
 * @typedef {{ ok: true, text: string } | { ok: false, reason: ProviderFailure }} ProviderResult
 * @typedef {{ name: string, generate: (req: ProviderRequest) => Promise<ProviderResult> }} Provider
 */

/** @param {unknown} err @returns {{ reason: ProviderFailure, retry: boolean }} */
function classify(err) {
  const e = /** @type {any} */ (err);
  const status = err instanceof ApiError ? err.status : (typeof e?.status === 'number' ? e.status : 0);
  if (e?.name === 'AbortError' || e?.name === 'TimeoutError' || /abort|timed? ?out/i.test(String(e?.message || ''))) return { reason: 'timeout', retry: false };
  if (status === 429) return { reason: 'quota', retry: false };          // never hammer a quota
  if (status === 401 || status === 403) return { reason: 'auth', retry: false };
  if (status === 400 || status === 404) return { reason: 'bad_request', retry: false };
  if (status >= 500 || status === 0) return { reason: 'unavailable', retry: true };
  return { reason: 'unavailable', retry: false };
}

/** @param {number} ms */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {import('../config').GeminiConfig} cfg
 * @param {{ fetch?: typeof fetch }} [deps] tests inject a fake fetch to exercise the real SDK path offline
 * @returns {Provider}
 */
function createGeminiProvider(cfg, deps = {}) {
  /** @type {any} */
  const httpOptions = { timeout: cfg.timeoutMs, retryOptions: { attempts: 1 } }; // our own bounded retry below
  if (deps.fetch) httpOptions.fetch = deps.fetch;
  const client = new GoogleGenAI({ apiKey: cfg.apiKey, httpOptions });

  /** @type {any} */
  const thinkingConfig = cfg.thinking === 'none' ? undefined
    : { thinkingLevel: cfg.thinking === 'low' ? ThinkingLevel.LOW : ThinkingLevel.MINIMAL };

  return {
    name: 'gemini',
    async generate(req) {
      let attempt = 0;
      for (;;) {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), cfg.timeoutMs);
        try {
          const res = await client.models.generateContent({
            model: cfg.model,
            contents: req.contents,
            config: {
              systemInstruction: req.systemInstruction,
              maxOutputTokens: cfg.maxOutputTokens,
              temperature: cfg.temperature,
              candidateCount: 1,
              responseMimeType: 'application/json',
              responseJsonSchema: RESPONSE_SCHEMA,
              ...(thinkingConfig ? { thinkingConfig } : {}),
              abortSignal: ac.signal
            }
          });
          const cand = res.candidates && res.candidates[0];
          const finish = cand && cand.finishReason;
          if (res.promptFeedback && res.promptFeedback.blockReason) return { ok: false, reason: 'blocked' };
          if (finish && /SAFETY|BLOCKLIST|PROHIBITED|SPII|RECITATION/.test(String(finish))) return { ok: false, reason: 'blocked' };
          return { ok: true, text: res.text || '' };
        } catch (err) {
          const c = classify(err);
          if (c.retry && attempt < cfg.maxRetries) { attempt++; await sleep(400 * attempt); continue; }
          return { ok: false, reason: c.reason };
        } finally {
          clearTimeout(timer);
        }
      }
    }
  };
}

module.exports = { createGeminiProvider, classify };
