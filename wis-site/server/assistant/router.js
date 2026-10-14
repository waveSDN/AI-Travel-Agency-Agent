'use strict';

const express = require('express');
const { SessionStore } = require('./sessions');

const COOKIE = 'wis_sid';
const COOKIE_PATH = '/api/assistant';

/** @param {string|undefined} header @param {string} name */
function readCookie(header, name) {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

/**
 * Same-origin guard for state-changing calls: a browser always sends Origin on a cross-site POST,
 * so a page elsewhere cannot use a visitor's session. JSON-only bodies block simple form posts.
 * @param {import('../config').Config} config
 */
function sameOrigin(config) {
  /** @type {import('express').RequestHandler} */
  return (req, res, next) => {
    const site = req.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'none') { res.status(403).json({ ok: false, reason: 'origin', message: 'طلب غير مسموح.' }); return; }
    const origin = req.get('origin');
    if (origin) {
      const own = `${req.protocol}://${req.get('host')}`;
      const allowed = origin === own || config.allowedOrigins.includes(origin);
      if (!allowed) { res.status(403).json({ ok: false, reason: 'origin', message: 'طلب غير مسموح.' }); return; }
    }
    if (req.method === 'POST' && !req.is('application/json')) { res.status(415).json({ ok: false, reason: 'content_type', message: 'طلب غير مسموح.' }); return; }
    next();
  };
}

/**
 * @param {{ config: import('../config').Config, service: ReturnType<typeof import('./service').createAssistantService> }} deps
 */
function createAssistantRouter({ config, service }) {
  const r = express.Router();
  const maxAge = config.limits.sessionTtlMinutes * 60;

  /** @param {import('express').Request} req @param {import('express').Response} res */
  function session(req, res) {
    let id = readCookie(req.headers.cookie, COOKIE);
    if (!SessionStore.validId(id)) id = SessionStore.newId();
    const secure = config.production || req.secure;
    res.setHeader('Set-Cookie', `${COOKIE}=${id}; Path=${COOKIE_PATH}; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`);
    return /** @type {string} */ (id);
  }

  r.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

  r.get('/status', (_req, res) => res.json(service.status()));

  r.post('/message', sameOrigin(config), express.json({ limit: '8kb', strict: true }), async (req, res, next) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const sid = session(req, res);
      const out = await service.handle({ sessionId: sid, ip: req.ip || '', message: body.message, context: body.context });
      const retryAfter = /** @type {any} */ (out.body).retryAfter;
      if (out.status === 429 && retryAfter) res.setHeader('Retry-After', String(retryAfter));
      res.status(out.status).json(out.body);
    } catch (err) { next(err); }
  });

  r.post('/clear', sameOrigin(config), express.json({ limit: '1kb' }), (req, res) => {
    const id = readCookie(req.headers.cookie, COOKIE);
    if (SessionStore.validId(id)) service.clear(/** @type {string} */ (id));
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; HttpOnly; SameSite=Strict`);
    res.json({ ok: true });
  });

  return r;
}

module.exports = { createAssistantRouter, readCookie, COOKIE };
