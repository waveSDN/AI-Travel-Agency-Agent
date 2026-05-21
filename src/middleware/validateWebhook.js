const { body, validationResult } = require('express-validator');

const webhookRules = [
  body('user')
    .trim()
    .notEmpty()
    .withMessage('user (phone number) is required')
    .matches(/^\+?[1-9]\d{7,14}$/)
    .withMessage('user must be a valid phone number'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('message is required')
    .isLength({ max: 4096 })
    .withMessage('message must not exceed 4096 characters'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { webhookRules, handleValidationErrors };
