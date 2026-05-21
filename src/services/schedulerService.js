const cron = require('node-cron');
const { processPendingFollowUps } = require('../tools/followUp');
const whatsappService = require('./whatsappService');
const logger = require('../utils/logger');

let schedulerStarted = false;

function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Run every 15 minutes — checks for pending follow-ups
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Scheduler: checking pending follow-ups');
    try {
      await processPendingFollowUps(whatsappService.sendMessage);
    } catch (err) {
      logger.error(`Scheduler error: ${err.message}`);
    }
  });

  logger.info('Follow-up scheduler started (every 15 minutes)');
}

module.exports = { startScheduler };
