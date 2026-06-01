import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

/**
 * Injects req.companyId from the authenticated user's company.
 * Must be used AFTER authMiddleware.
 */
export function tenantGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.companyId) {
    res.status(401).json(
      errorResponse('Tenant não identificado', 'UNAUTHORIZED')
    );
    return;
  }
  req.companyId = req.user.companyId;
  next();
}
