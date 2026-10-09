'use strict';

/**
 * Exercises the real Google GenAI SDK request path with a fake fetch: no network, no quota used.
 * This proves request shape and error handling only. It is NOT evidence that live Gemini calls work.
 */
const { createGeminiProvider } = require('../../server/assistant/gemini');
const { FAKE_KEY } = require('../helpers');

const base = { enabled: true, apiKey: FAKE_KEY, model: 'gemini-3.5-flash-lite', timeoutMs: 2000, maxRetries: 1, maxOutputTokens: 512, temperature: 0.3, thinking: /** @type {'minimal'} */ ('minimal') };
const okBody = { candidates: [{ content: { role: 'model', parts: [{ text: '{"reply":"مرحبا","sector":"none","needsTeam":false}' }] }, finishReason: 'STOP' }] };

/** @param {number} status @param {any} body @param {number} [delay] */
function fakeFetch(status, body, delay = 0) {
  /** @type {{ url: string, init: any }[]} */
  const seen = [];
  /** @type {any} */
  const f = async (/** @type {any} */ url, /** @type {any} */ init) => {
    seen.push({ url: String(url), init });
    if (delay) {
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, delay);
        if (init && init.signal) init.signal.addEventListener('abort', () => { clearTimeout(t); const e = new Error('aborted'); e.name = 'AbortError'; reject(e); });
      });
    }
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  return { f, seen };
}
const req = { systemInstruction: 'تعليمات', contents: [{ role: /** @type {'user'} */ ('user'), parts: [{ text: 'سؤال' }] }] };

test('sends one generateContent call with JSON output, token cap and no tools; key in header only', async () => {
  const { f, seen } = fakeFetch(200, okBody);
  const r = await createGeminiProvider(base, { fetch: f }).generate(req);
  expect(r).toEqual({ ok: true, text: '{"reply":"مرحبا","sector":"none","needsTeam":false}' });
  expect(seen).toHaveLength(1);
  expect(seen[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
  expect(seen[0].url).not.toContain(FAKE_KEY);
  const headers = Object.fromEntries(new Headers(seen[0].init.headers));
  expect(headers['x-goog-api-key']).toBe(FAKE_KEY);
  const body = JSON.parse(seen[0].init.body);
  expect(Object.keys(body).sort()).toEqual(['contents', 'generationConfig', 'systemInstruction']);
  expect(body.generationConfig).toMatchObject({ maxOutputTokens: 512, responseMimeType: 'application/json', candidateCount: 1, thinkingConfig: { thinkingLevel: 'MINIMAL' } });
  expect(body.generationConfig.responseJsonSchema.properties.sector.enum).toEqual(['clinic', 'travel', 'sales', 'none']);
  expect(body.tools).toBeUndefined();
});

test('429 is reported as quota and never retried', async () => {
  const { f, seen } = fakeFetch(429, { error: { code: 429, message: 'Resource exhausted', status: 'RESOURCE_EXHAUSTED' } });
  expect(await createGeminiProvider(base, { fetch: f }).generate(req)).toEqual({ ok: false, reason: 'quota' });
  expect(seen).toHaveLength(1);
});

test('5xx is retried once, then reported as unavailable', async () => {
  const { f, seen } = fakeFetch(503, { error: { code: 503, message: 'Unavailable', status: 'UNAVAILABLE' } });
  expect(await createGeminiProvider(base, { fetch: f }).generate(req)).toEqual({ ok: false, reason: 'unavailable' });
  expect(seen).toHaveLength(2);
});

test('403 (bad key / no access) is not retried', async () => {
  const { f, seen } = fakeFetch(403, { error: { code: 403, message: 'denied', status: 'PERMISSION_DENIED' } });
  expect(await createGeminiProvider(base, { fetch: f }).generate(req)).toEqual({ ok: false, reason: 'auth' });
  expect(seen).toHaveLength(1);
});

test('a slow answer is cut at the timeout', async () => {
  const { f } = fakeFetch(200, okBody, 10000);
  const t0 = Date.now();
  const r = await createGeminiProvider({ ...base, timeoutMs: 2000 }, { fetch: f }).generate(req);
  expect(r).toEqual({ ok: false, reason: 'timeout' });
  expect(Date.now() - t0).toBeLessThan(4000);
});

test('a safety block is not shown as an answer', async () => {
  const { f } = fakeFetch(200, { candidates: [{ content: { role: 'model', parts: [] }, finishReason: 'SAFETY' }] });
  expect(await createGeminiProvider(base, { fetch: f }).generate(req)).toEqual({ ok: false, reason: 'blocked' });
});
