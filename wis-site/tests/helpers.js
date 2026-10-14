'use strict';

const { loadConfig } = require('../server/config');
const { createApp } = require('../server/app');

/** A key-shaped string that must never appear in any response, log line or client file. */
const FAKE_KEY = 'fake-gemini-key-for-tests-7f3a9c';

/**
 * @param {Record<string, string>} [env]
 */
function makeConfig(env = {}) {
  return loadConfig({ GEMINI_API_KEY: FAKE_KEY, ...env });
}

/**
 * Mock provider: records every request and answers with whatever `respond` returns.
 * @param {(req: any, n: number) => any} [respond]
 */
function mockProvider(respond) {
  /** @type {any[]} */
  const calls = [];
  const fn = respond || (() => ({ ok: true, text: JSON.stringify({ reply: 'WIS في مرحلة بناء الأساس وتطوير النماذج الأولية.', sector: 'none', needsTeam: false }) }));
  return {
    calls,
    provider: {
      name: 'mock',
      /** @param {any} req */
      async generate(req) { calls.push(req); return fn(req, calls.length); }
    }
  };
}

/** @param {{ env?: Record<string, string>, respond?: (req: any, n: number) => any, provider?: any, clock?: { t: number } }} [o] */
function testApp(o = {}) {
  const config = makeConfig(o.env);
  const mock = mockProvider(o.respond);
  /** @type {any[]} */
  const logs = [];
  const clock = o.clock;
  const { app, service } = createApp({
    config,
    provider: o.provider !== undefined ? o.provider : mock.provider,
    log: (event, data) => logs.push(JSON.stringify({ event, ...(data || {}) })),
    now: clock ? () => clock.t : undefined
  });
  return { app, service, config, calls: mock.calls, logs };
}

/** @param {any} res */
const sidCookie = (res) => {
  const set = res.headers['set-cookie'];
  const c = Array.isArray(set) ? set[0] : set;
  return c ? c.split(';')[0] : '';
};

module.exports = { FAKE_KEY, makeConfig, mockProvider, testApp, sidCookie };
