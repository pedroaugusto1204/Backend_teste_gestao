import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../config/jwt';
import { errorResponse } from '../utils/response';

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      companyId?: string;
    }
  }
}

/**
 * Validates the Bearer JWT in Authorization header.
 * Injects req.user with decoded token payload.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(
      errorResponse('Token de autenticação não fornecido', 'UNAUTHORIZED')
    );
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json(
      errorResponse('Token inválido ou expirado', 'UNAUTHORIZED')
    );
  }
}
