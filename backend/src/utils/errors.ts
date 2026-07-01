import { ERROR_CODES } from '@anomaly/shared';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(statusCode: number, errorCode: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details?: any) {
    super(400, ERROR_CODES.BAD_REQUEST, message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation Failed', details?: any) {
    super(422, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', details?: any) {
    super(401, ERROR_CODES.UNAUTHORIZED, message, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', details?: any) {
    super(403, ERROR_CODES.FORBIDDEN, message, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', details?: any) {
    super(404, ERROR_CODES.NOT_FOUND, message, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: any) {
    super(409, ERROR_CODES.CONFLICT, message, details);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details?: any) {
    super(500, ERROR_CODES.INTERNAL_SERVER_ERROR, message, details);
  }
}
