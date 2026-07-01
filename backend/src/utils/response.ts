import { Response } from 'express';
import { ApiResponse } from '@anomaly/shared';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response<ApiResponse<T>> {
  const responseBody: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(responseBody);
}

export function sendError(
  res: Response,
  message: string,
  code: string,
  statusCode = 500,
  details?: any
): Response<ApiResponse<never>> {
  const responseBody: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(responseBody);
}
