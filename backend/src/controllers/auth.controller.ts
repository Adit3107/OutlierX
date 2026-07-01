import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.js';

export class AuthController {
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, req.auth, 200, 'Authenticated user loaded');
    } catch (error) {
      next(error);
    }
  };
}
