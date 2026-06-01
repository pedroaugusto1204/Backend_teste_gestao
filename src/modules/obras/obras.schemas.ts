import { z } from 'zod';

export const createObraSchema = z.object({
  contract_id: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().optional(),
  budget: z.number({ coerce: true }).positive().optional(),
  start_date: z.string().datetime({ offset: true }).optional(),
  end_date: z.string().datetime({ offset: true }).optional(),
  responsible: z.string().optional(),
  notes: z.string().optional(),
});

export const updateObraSchema = createObraSchema.partial().extend({
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createStepSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  phase: z.enum(['PLANEJAMENTO', 'PRE_OBRA', 'FUNDACAO', 'ALVENARIA', 'INSTALACOES', 'ACABAMENTO', 'ENTREGA']),
  order: z.number().int().default(0),
  due_date: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
});

export const updateStepSchema = createStepSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED']).optional(),
  completed_at: z.string().datetime({ offset: true }).optional(),
});

export const createVistoriaSchema = z.object({
  type: z.enum(['INICIAL', 'PARCIAL', 'FINAL']),
  date: z.string().datetime({ offset: true }),
  inspector: z.string().min(2),
  description: z.string().optional(),
  conditions: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
});

export const updateVistoriaSchema = createVistoriaSchema.partial();

export const createCustoSchema = z.object({
  category: z.enum(['MATERIAL', 'MAO_DE_OBRA', 'EQUIPAMENTO', 'SERVICO_TERCEIRO', 'LICENCA_TAXA', 'TRANSPORTE', 'OUTROS']),
  description: z.string().min(2),
  supplier: z.string().optional(),
  value: z.number({ coerce: true }).positive(),
  date: z.string().datetime({ offset: true }),
  invoice_no: z.string().optional(),
  payment_status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  paid_at: z.string().datetime({ offset: true }).optional(),
  notes: z.string().optional(),
});

export const updateCustoSchema = createCustoSchema.partial();

export type CreateObraInput = z.infer<typeof createObraSchema>;
export type UpdateObraInput = z.infer<typeof updateObraSchema>;
export type CreateStepInput = z.infer<typeof createStepSchema>;
export type UpdateStepInput = z.infer<typeof updateStepSchema>;
export type CreateVistoriaInput = z.infer<typeof createVistoriaSchema>;
export type UpdateVistoriaInput = z.infer<typeof updateVistoriaSchema>;
export type CreateCustoInput = z.infer<typeof createCustoSchema>;
export type UpdateCustoInput = z.infer<typeof updateCustoSchema>;
