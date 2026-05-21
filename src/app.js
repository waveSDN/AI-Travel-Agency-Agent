const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const webhookRouter = require('./routes/webhook');
const healthRouter = require('./routes/health');
const metricsRouter = require('./routes/metrics');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const observability = require('./observability/observabilitySubscriber');
const tools = require('./tools');
const travelMessageWorkflow = require('./workflows/travelMessageWorkflow');
const logger = require('./utils/logger');

let bootstrapped = false;

/**
 * Build (but don't start) the Express app.
 * Separating this from `app.listen` keeps the app testable.
 */
function buildApp() {
  if (!bootstrapped) {
    observability.register();
    tools.registerAll();
    travelMessageWorkflow.register();
    bootstrapped = true;
  }

  const app = express();

  // ── Security ────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({ origin: false }));
  app.set('trust proxy', 1);

  // ── Request parsing ─────────────────────────────────────────
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '256kb' }));

  // ── HTTP logging ─────────────────────────────────────────────
  app.use(
    morgan('[:date[iso]] :method :url :status :res[content-length] - :response-time ms', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    }),
  );

  // ── Routes ───────────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/metrics', metricsRouter);
  app.use('/webhook', webhookRouter);

  // ── 404 & error handlers ─────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { buildApp };
