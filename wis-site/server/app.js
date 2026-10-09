'use strict';

const path = require('node:path');
const express = require('express');
const helmetModule = require('helmet');
/** @type {typeof import('helmet').default} */
const helmet = /** @type {any} */ (helmetModule).default || helmetModule;
const { loadKnowledge, loadAssistant } = require('./knowledge');
const { SessionStore } = require('./assistant/sessions');
const { WindowCounter, DailyBudget } = require('./assistant/limits');
const { createGeminiProvider } = require('./assistant/gemini');
const { createAssistantService } = require('./assistant/service');
const { createAssistantRouter } = require('./assistant/router');

/**
 * @param {{
 *   config: import('./config').Config,
 *   provider?: import('./assistant/gemini').Provider | null,
 *   publicDir?: string,
 *   log?: (event: string, data?: Record<string, unknown>) => void,
 *   now?: () => number
 * }} opts
 */
function createApp(opts) {
  const { config } = opts;
  const log = opts.log || (() => {});
  const now = opts.now || Date.now;
  const publicDir = opts.publicDir || path.join(__dirname, '..', 'public');
  const provider = opts.provider !== undefined ? opts.provider
    // created whenever a key is set, so removing the kill-switch file turns answers back on without a restart
    : config.gemini.enabled && config.gemini.apiKey ? createGeminiProvider(config.gemini) : null;

  const service = createAssistantService({
    config, provider, log,
    knowledge: loadKnowledge(),
    assistant: loadAssistant(),
    sessions: new SessionStore({ ttlMs: config.limits.sessionTtlMinutes * 60000, maxSessions: config.limits.maxSessions, maxTurns: config.limits.maxTurns, now }),
    sessionLimiter: new WindowCounter({ limit: config.limits.perSessionPerMinute, windowMs: 60000, now }),
    ipLimiter: new WindowCounter({ limit: config.limits.perIpPerMinute, windowMs: 60000, now }),
    daily: new DailyBudget({ limit: config.limits.globalPerDay, now })
  });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // inline style attributes from the design system; no inline scripts anywhere
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        ...(config.production ? { upgradeInsecureRequests: [] } : {})
      }
    },
    strictTransportSecurity: config.production,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));
  app.use((_req, res, next) => { res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()'); next(); });

  // request log without bodies, queries or cookies: never the visitor's text
  app.use((req, res, next) => {
    const t = now();
    res.on('finish', () => { if (req.path.startsWith('/api/')) log('http', { method: req.method, path: req.path, status: res.statusCode, ms: now() - t }); });
    next();
  });

  app.use('/api/assistant', createAssistantRouter({ config, service }));
  app.use('/api', (_req, res) => res.status(404).json({ ok: false, reason: 'not_found' }));

  app.use(express.static(publicDir, {
    index: 'index.html',
    setHeaders(res, file) {
      res.setHeader('Cache-Control', file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600');
    }
  }));
  app.use((_req, res) => res.status(404).type('text/plain; charset=utf-8').send('الصفحة غير موجودة.'));

  /** @type {import('express').ErrorRequestHandler} */
  const onError = (err, req, res, _next) => {
    const e = /** @type {any} */ (err);
    const status = e && (e.type === 'entity.too.large' ? 413 : e.type === 'entity.parse.failed' ? 400 : 500);
    log('error', { path: req.path, status, type: e && e.type ? String(e.type) : 'internal' });
    if (res.headersSent) return;
    res.status(status).json({ ok: false, reason: status === 500 ? 'internal' : 'bad_request', message: 'تعذّر تنفيذ الطلب.' });
  };
  app.use(onError);

  return { app, service };
}

module.exports = { createApp };
