import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
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

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'CSV upload must be 100 MB or smaller'
        : 'Invalid upload request';
    logger.warn(`Upload Error: ${message} | URL: ${req.originalUrl}`, {
      code: err.code,
    });
    sendError(res, message, ERROR_CODES.BAD_REQUEST, 400, { code: err.code });
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
