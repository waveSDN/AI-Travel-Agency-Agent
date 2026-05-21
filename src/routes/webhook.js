const express = require('express');
const { webhookLimiter } = require('../middleware/rateLimiter');
const { webhookRules, handleValidationErrors } = require('../middleware/validateWebhook');
const { handleIncomingMessage, handleVerification } = require('../controllers/webhookController');

const router = express.Router();

// GET /webhook — WhatsApp verification handshake
router.get('/', handleVerification);

// POST /webhook — incoming customer messages
router.post(
  '/',
  webhookLimiter,
  webhookRules,
  handleValidationErrors,
  handleIncomingMessage,
);

module.exports = router;
