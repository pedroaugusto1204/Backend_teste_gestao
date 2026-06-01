import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from './auth.schemas';
import { successResponse } from '../../utils/response';

const authService = new AuthService();

export class AuthController {
  /** POST /api/auth/register */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/login */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/refresh */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const data = refreshSchema.parse(req.body);
      const result = await authService.refresh(data);
      res.json(successResponse(result));
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/logout */
  logout(_req: Request, res: Response) {
    // Stateless JWT — client simply discards tokens
    res.json(successResponse({ message: 'Logout realizado com sucesso' }));
  }

  /** GET /api/auth/me */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await authService.me(userId);
      res.json(successResponse(user));
    } catch (err) {
      next(err);
    }
  }
}
