import { z } from 'zod';

const POItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number({ coerce: true }).positive(),
  unit: z.string().min(1),
  unit_price: z.number({ coerce: true }).positive(),
  total: z.number({ coerce: true }).positive(),
});

export const createPOSchema = z.object({
  obra_id: z.string().uuid().optional(),
  title: z.string().min(3),
  supplier: z.string().min(2),
  supplier_cnpj: z.string().optional(),
  payer_cnpj: z.string().min(14, 'CNPJ do pagador é obrigatório'),
  items: z.array(POItemSchema).min(1, 'Ao menos um item é obrigatório'),
  subtotal: z.number({ coerce: true }).positive(),
  taxes: z.number({ coerce: true }).min(0).default(0),
  discount: z.number({ coerce: true }).min(0).default(0),
  total: z.number({ coerce: true }).positive(),
  due_date: z.string().datetime({ offset: true }).optional(),
  delivery_date: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
});

export const updatePOSchema = createPOSchema.partial();

export const approveSchema = z.object({
  approved_by: z.string().min(2),
});

export type CreatePOInput = z.infer<typeof createPOSchema>;
export type UpdatePOInput = z.infer<typeof updatePOSchema>;
export type ApproveInput = z.infer<typeof approveSchema>;
