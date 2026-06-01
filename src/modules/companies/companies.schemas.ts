import { z } from 'zod';
import { cnpjSchema } from '../../utils/validators';

export const createCompanySchema = z.object({
  name: z.string().min(2),
  cnpj: cnpjSchema,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  groq_api_key: z.string().optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
