import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parse pagination params from query string.
 * Defaults: page=1, limit=20. Max limit capped at 100.
 */
export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt((req.query.limit as string) ?? '20', 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build meta object for paginated responses.
 */
export function buildMeta(
  total: number,
  page: number,
  limit: number
): Record<string, unknown> {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

/**
 * Parse sort params from query string.
 * @returns Prisma-compatible orderBy object
 */
export function parseSorting(
  req: Request,
  allowedFields: string[],
  defaultField = 'createdAt'
): Record<string, 'asc' | 'desc'> {
  const sortBy = req.query.sort_by as string;
  const sortOrder = (req.query.sort_order as string) === 'asc' ? 'asc' : 'desc';
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { [field]: sortOrder };
}
