const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    logger.warn(`Operational error [${err.code}]: ${err.message}`, {
      path: req.path,
      method: req.method,
    });
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_ERROR',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
}

module.exports = { errorHandler, notFoundHandler };
