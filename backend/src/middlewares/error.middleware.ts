import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../lib/logger.js';
import { ERROR_CODES } from '@anomaly/shared';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // If headers already sent, delegate to standard Express handler
  if (res.headersSent) {
    _next(err);
    return;
  }

  if (err instanceof ApiError) {
    logger.warn(`API Error: ${err.message} | URL: ${req.originalUrl} | Status: ${err.statusCode}`, {
      code: err.errorCode,
      details: err.details,
    });
    sendError(res, err.message, err.errorCode, err.statusCode, err.details);
    return;
  }

  // Handle default unhandled errors
  logger.error(`Unhandled Exception occurred: ${err.message}`, err, {
    url: req.originalUrl,
    method: req.method,
  });

  sendError(
    res,
    'An unexpected error occurred. Please try again later.',
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    500
  );
}
