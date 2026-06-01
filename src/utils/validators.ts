import { z } from 'zod';

/** Remove non-numeric characters from CPF/CNPJ */
export const cleanDocument = (doc: string): string =>
  doc.replace(/\D/g, '');

/** Validate CPF format (basic digit count check) */
export const cpfSchema = z
  .string()
  .transform(cleanDocument)
  .refine((v) => v.length === 11, { message: 'CPF deve ter 11 dígitos' });

/** Validate CNPJ format (basic digit count check) */
export const cnpjSchema = z
  .string()
  .transform(cleanDocument)
  .refine((v) => v.length === 14, { message: 'CNPJ deve ter 14 dígitos' });

/** Phone: allows various formats, strips to digits */
export const phoneSchema = z
  .string()
  .optional()
  .transform((v) => (v ? v.replace(/\D/g, '') : undefined));

/** Currency value: must be positive */
export const currencySchema = z
  .number({ coerce: true })
  .positive('Valor deve ser positivo');

/** UUID validation */
export const uuidSchema = z.string().uuid('ID inválido');

/** Pagination query schema */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

/** Date range query schema */
export const dateRangeSchema = z.object({
  start_date: z.string().datetime({ offset: true }).optional(),
  end_date: z.string().datetime({ offset: true }).optional(),
});
