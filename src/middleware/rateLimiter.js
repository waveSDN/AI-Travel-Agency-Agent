const rateLimit = require('express-rate-limit');
const { rateLimit: config } = require('../config/env');
const logger = require('../utils/logger');

const webhookLimiter = rateLimit({
  windowMs: config.windowMs,
  max: config.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
  },
});

module.exports = { webhookLimiter };
