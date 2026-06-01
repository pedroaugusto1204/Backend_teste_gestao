import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from './env';

export interface TokenPayload {
  userId: string;
  companyId: string;
  role: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  companyId: string;
}

/**
 * Sign a short-lived access token (default 7d).
 */
export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Sign a long-lived refresh token (default 30d).
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/**
 * Verify and decode an access token. Throws on invalid/expired.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

/**
 * Verify and decode a refresh token. Throws on invalid/expired.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
