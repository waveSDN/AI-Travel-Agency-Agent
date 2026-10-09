'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { loadConfig, geminiReady } = require('./config');
const { createApp } = require('./app');

// optional local .env (never committed); real deployments set the environment directly
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') process.loadEnvFile(envFile);

const config = loadConfig();
const { app } = createApp({
  config,
  // one line per event, reason codes and timings only: no message text, no key, no cookies
  log: (event, data) => console.log(JSON.stringify({ t: new Date().toISOString(), event, ...(data || {}) }))
});

app.listen(config.port, config.host, () => {
  const g = config.gemini;
  const mode = geminiReady(g) ? `Gemini enabled (model ${g.model})` : g.enabled ? 'Gemini not configured: approved answers only' : 'Gemini disabled by GEMINI_ENABLED=false';
  console.log(`WIS site on http://${config.host}:${config.port} — ${mode}`);
});
