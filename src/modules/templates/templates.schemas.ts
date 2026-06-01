import { z } from 'zod';

const ContractTypeEnum = z.enum([
  'SERVICO', 'TRABALHO', 'OBRA', 'LOCACAO',
  'COMPRA_VENDA', 'PARCERIA', 'CONFIDENCIALIDADE', 'OUTROS',
]);

const FieldTypeEnum = z.enum([
  'TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'EMAIL', 'PHONE',
  'CPF', 'CNPJ', 'CURRENCY', 'SELECT', 'CHECKBOX', 'SIGNATURE', 'ADDRESS',
]);

export const createTemplateSchema = z.object({
  name: z.string().min(2),
  type: ContractTypeEnum,
  description: z.string().optional(),
  html_content: z.string().min(1),
  active: z.boolean().default(true),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const createFieldSchema = z.object({
  label: z.string().min(1),
  field_key: z.string().min(1).regex(/^[a-z_]+$/, 'field_key deve ser snake_case'),
  field_type: FieldTypeEnum,
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).default([]),
  order: z.number().int().default(0),
});

export const updateFieldSchema = createFieldSchema.partial();

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
