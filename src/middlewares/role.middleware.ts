import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

/**
 * Factory that returns a middleware enforcing one of the allowed roles.
 * Must be used AFTER authMiddleware.
 *
 * @param roles - Array of allowed UserRole strings
 */
export function roleGuard(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json(
        errorResponse(
          `Acesso negado. Requer uma das roles: ${roles.join(', ')}`,
          'FORBIDDEN'
        )
      );
      return;
    }
    next();
  };
}
