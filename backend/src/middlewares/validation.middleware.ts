import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody(schema: ZodTypeAny) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Request body validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Request query parameters validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}

export function validateParams(schema: ZodTypeAny) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Request path parameters validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
}
