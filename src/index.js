const { validateEnv, server } = require('./config/env');

validateEnv();

const { buildApp } = require('./app');
const { startScheduler } = require('./services/schedulerService');
const logger = require('./utils/logger');

const app = buildApp();
const PORT = server.port;

app.listen(PORT, () => {
  logger.info(`AI Travel Agency Agent running on port ${PORT} [${server.env}]`);
  startScheduler();
});

module.exports = app;
