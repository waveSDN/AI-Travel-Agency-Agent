'use strict';

const fs = require('node:fs');

/**
 * Server configuration. Everything is read from the environment once, clamped to safe bounds,
 * and never echoed back to clients or logs (the API key in particular).
 */

/**
 * @typedef {object} GeminiConfig
 * @property {boolean} enabled      GEMINI_ENABLED=false turns live answers off (read at start-up)
 * @property {string} apiKey         server-only secret; empty means "not configured"
 * @property {string} model
 * @property {number} timeoutMs
 * @property {number} maxRetries     extra attempts for 5xx / network errors only (never for 429)
 * @property {number} maxOutputTokens
 * @property {number} temperature
 * @property {'minimal'|'low'|'none'} thinking
 * @property {string} killFile       if this file exists, live answers are off at once (checked per request, no restart)
 *
 * @typedef {object} LimitsConfig
 * @property {number} maxMessageChars
 * @property {number} maxTurns          remembered question/answer pairs per session
 * @property {number} maxContextChars   cap on the history sent with a request
 * @property {number} perSessionPerMinute
 * @property {number} perIpPerMinute
 * @property {number} globalPerDay      requests to Gemini per UTC day, whole process
 * @property {number} sessionTtlMinutes
 * @property {number} maxSessions
 *
 * @typedef {object} Config
 * @property {number} port
 * @property {string} host
 * @property {boolean} production
 * @property {string[]} allowedOrigins
 * @property {boolean|number|string} trustProxy
 * @property {GeminiConfig} gemini
 * @property {LimitsConfig} limits
 */

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Config}
 */
function loadConfig(env = process.env) {
  /** @param {string} name @param {number} def @param {number} min @param {number} max */
  const int = (name, def, min, max) => {
    const v = Number.parseInt(env[name] ?? '', 10);
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
  };
  /** @param {string} name @param {number} def @param {number} min @param {number} max */
  const num = (name, def, min, max) => {
    const v = Number.parseFloat(env[name] ?? '');
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
  };
  const thinking = (env.GEMINI_THINKING || 'minimal').toLowerCase();
  const tp = (env.TRUST_PROXY || '').trim();

  return {
    port: int('PORT', 3100, 1, 65535),
    host: env.HOST || '127.0.0.1',
    production: env.NODE_ENV === 'production',
    allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
    // behind a reverse proxy set TRUST_PROXY=1 (number of hops) so per-IP limits see the client address
    trustProxy: tp === '' ? false : /^\d+$/.test(tp) ? Number(tp) : tp,
    gemini: {
      enabled: (env.GEMINI_ENABLED || 'true').toLowerCase() !== 'false',
      apiKey: (env.GEMINI_API_KEY || '').trim(),
      model: (env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim(),
      timeoutMs: int('GEMINI_TIMEOUT_MS', 15000, 2000, 60000),
      maxRetries: int('GEMINI_MAX_RETRIES', 1, 0, 2),
      maxOutputTokens: int('GEMINI_MAX_OUTPUT_TOKENS', 512, 64, 2048),
      temperature: num('GEMINI_TEMPERATURE', 0.3, 0, 1),
      thinking: thinking === 'none' || thinking === 'low' ? thinking : 'minimal',
      killFile: (env.GEMINI_KILL_SWITCH_FILE || '').trim()
    },
    limits: {
      maxMessageChars: int('ASSISTANT_MAX_MESSAGE_CHARS', 1500, 100, 4000),
      maxTurns: int('ASSISTANT_MAX_TURNS', 10, 1, 30),
      maxContextChars: int('ASSISTANT_MAX_CONTEXT_CHARS', 8000, 1000, 40000),
      perSessionPerMinute: int('ASSISTANT_SESSION_RPM', 5, 1, 60),
      perIpPerMinute: int('ASSISTANT_IP_RPM', 20, 1, 600),
      globalPerDay: int('ASSISTANT_DAILY_LIMIT', 100, 0, 100000),
      sessionTtlMinutes: int('ASSISTANT_SESSION_TTL_MIN', 30, 5, 240),
      maxSessions: int('ASSISTANT_MAX_SESSIONS', 2000, 10, 100000)
    }
  };
}

/**
 * True when live answers may be attempted: switch on, a key present, and no kill-switch file.
 * @param {GeminiConfig} g
 */
function geminiReady(g) {
  return g.enabled && g.apiKey.length > 0 && !(g.killFile && fs.existsSync(g.killFile));
}

module.exports = { loadConfig, geminiReady };
