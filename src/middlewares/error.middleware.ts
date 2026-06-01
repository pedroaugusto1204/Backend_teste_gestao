import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware.
 * Maps known error types to standardized API responses.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: 'Dados de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    res.status(422).json({
      success: false,
      error: err.message,
      code: 'UPLOAD_ERROR',
    });
    return;
  }

  // Prisma known errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as AppError & { meta?: { target?: string[] } };
    const code = (err as AppError & { code?: string }).code;

    if (code === 'P2002') {
      res.status(409).json({
        success: false,
        error: `Registro duplicado: ${prismaErr.meta?.target?.join(', ')}`,
        code: 'CONFLICT',
      });
      return;
    }

    if (code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
        code: 'NOT_FOUND',
      });
      return;
    }
  }

  // Custom app errors with statusCode
  if (err.statusCode) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code ?? 'ERROR',
    });
    return;
  }

  // Log unexpected errors
  console.error('[ErrorHandler]', err);

  res.status(500).json({
    success: false,
    error:
      env.NODE_ENV === 'development'
        ? err.message
        : 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Factory to create application errors with statusCode and code.
 */
export function createError(
  message: string,
  statusCode: number,
  code: string
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

export const AppErrors = {
  badRequest: (msg = 'Requisição inválida') =>
    createError(msg, 400, 'BAD_REQUEST'),
  unauthorized: (msg = 'Não autorizado') =>
    createError(msg, 401, 'UNAUTHORIZED'),
  forbidden: (msg = 'Acesso negado') =>
    createError(msg, 403, 'FORBIDDEN'),
  notFound: (msg = 'Recurso não encontrado') =>
    createError(msg, 404, 'NOT_FOUND'),
  conflict: (msg = 'Conflito de dados') =>
    createError(msg, 409, 'CONFLICT'),
  validation: (msg = 'Dados inválidos') =>
    createError(msg, 422, 'VALIDATION_ERROR'),
  internal: (msg = 'Erro interno') =>
    createError(msg, 500, 'INTERNAL_ERROR'),
};
