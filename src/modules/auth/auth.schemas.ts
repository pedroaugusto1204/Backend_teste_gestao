import { z } from 'zod';
import { cnpjSchema } from '../../utils/validators';

export const registerSchema = z.object({
  // Company
  company_name: z.string().min(2, 'Nome da empresa obrigatório'),
  company_cnpj: cnpjSchema,
  company_email: z.string().email().optional(),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  // Admin user
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token obrigatório'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
