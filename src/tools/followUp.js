const followUpRepo = require('../database/followUpRepository');
const { followUp: config } = require('../config/env');
const logger = require('../utils/logger');

const FOLLOW_UP_MESSAGES = [
  {
    dayOffset: 1,
    message: 'Hi! 👋 I wanted to check if you\'re still interested in your travel plan. We have great deals available right now. Can I help you complete your booking?',
  },
  {
    dayOffset: 3,
    message: '✈️ Special offer alert! We have exclusive deals on flights and hotels for your requested destination. Would you like me to share the details?',
  },
  {
    dayOffset: 7,
    message: '🌍 It\'s been a week — just wanted to make sure you haven\'t missed out! Let me know if you\'d like help finalizing your trip. Our team is ready to assist you.',
  },
];

async function scheduleFollowUps(customerId) {
  const now = new Date();

  const scheduled = await Promise.all(
    FOLLOW_UP_MESSAGES.map(({ dayOffset, message }) => {
      const scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + dayOffset);

      return followUpRepo.scheduleFollowUp({
        customerId,
        scheduledAt: scheduledAt.toISOString(),
        message,
      });
    }),
  );

  logger.info(`Scheduled ${scheduled.length} follow-ups for customer ${customerId}`);
  return scheduled;
}

async function processPendingFollowUps(sendFn) {
  const pending = await followUpRepo.getPendingFollowUps();
  logger.info(`Processing ${pending.length} pending follow-ups`);

  for (const followUp of pending) {
    try {
      await sendFn(followUp.customers.phone, followUp.message);
      await followUpRepo.markSent(followUp.id);
      logger.info(`Follow-up sent to ${followUp.customers.phone}`);
    } catch (err) {
      logger.error(`Failed to send follow-up ${followUp.id}: ${err.message}`);
    }
  }
}

module.exports = { scheduleFollowUps, processPendingFollowUps };
