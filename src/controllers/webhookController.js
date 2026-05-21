const { findOrCreateByPhone } = require('../database/customerRepository');
const { cancelFollowUpsForCustomer } = require('../database/followUpRepository');
const travelAgent = require('../agents/travelAgent');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');

async function handleIncomingMessage(req, res) {
  const { user: phone, message } = req.body;

  logger.http(`Incoming webhook — phone: ${phone}, message: "${message}"`);

  // Respond 200 immediately so WhatsApp doesn't retry
  res.status(200).json({ success: true, received: true });

  // Process asynchronously — never block the webhook response
  setImmediate(async () => {
    try {
      const customer = await findOrCreateByPhone(phone);

      // Cancel pending follow-ups when customer re-engages
      await cancelFollowUpsForCustomer(customer.id);

      const result = await travelAgent.process({ customer, message });

      await whatsappService.sendMessage(phone, result.reply);

      logger.info(`Response delivered to ${phone}`, {
        intent: result.entities?.intent,
        score: result.leadScore,
        escalated: result.escalated,
      });
    } catch (err) {
      logger.error(`Failed to process message from ${phone}: ${err.message}`, {
        stack: err.stack,
      });

      // Best-effort error message to customer
      try {
        await whatsappService.sendMessage(
          phone,
          "I'm sorry, something went wrong on our end. Our team will get back to you shortly. 🙏",
        );
      } catch {
        // Silently ignore secondary failure
      }
    }
  });
}

async function handleVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const { whatsapp } = require('../config/env');

  if (mode === 'subscribe' && token === whatsapp.verifyToken) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }

  logger.warn('Webhook verification failed', { mode, token });
  res.status(403).json({ error: 'Verification failed' });
}

module.exports = { handleIncomingMessage, handleVerification };
