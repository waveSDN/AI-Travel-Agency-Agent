const { validateEnv, server } = require('./config/env');

// Validate environment before anything else
validateEnv();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const webhookRouter = require('./routes/webhook');
const healthRouter = require('./routes/health');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { startScheduler } = require('./services/schedulerService');
const logger = require('./utils/logger');

const app = express();

// ── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: false })); // Webhooks are server-to-server, disable CORS
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
app.use('/webhook', webhookRouter);

// ── 404 & error handlers ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────
const PORT = server.port;

app.listen(PORT, () => {
  logger.info(`AI Travel Agency Agent running on port ${PORT} [${server.env}]`);
  startScheduler();
});

module.exports = app; // for testing
