/**
 * Standard API success response.
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): { success: true; data: T; meta?: Record<string, unknown> } {
  const result: { success: true; data: T; meta?: Record<string, unknown> } = { success: true, data };
  if (meta !== undefined) result.meta = meta;
  return result;
}

/**
 * Standard API error response.
 */
export function errorResponse(
  error: string,
  code: string,
  details?: unknown
): { success: false; error: string; code: string; details?: unknown } {
  const result: { success: false; error: string; code: string; details?: unknown } = { success: false, error, code };
  if (details !== undefined) result.details = details;
  return result;
}
