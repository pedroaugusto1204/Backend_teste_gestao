import { z } from 'zod';

const ContractTypeEnum = z.enum([
  'SERVICO', 'TRABALHO', 'OBRA', 'LOCACAO',
  'COMPRA_VENDA', 'PARCERIA', 'CONFIDENCIALIDADE', 'OUTROS',
]);

const ContractStatusEnum = z.enum([
  'DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'ACTIVE',
  'EXPIRING_SOON', 'EXPIRED', 'CANCELLED', 'ARCHIVED',
]);

export const createContractSchema = z.object({
  template_id: z.string().uuid().optional(),
  title: z.string().min(3),
  type: ContractTypeEnum,
  related_party: z.string().min(2),
  related_party_doc: z.string().optional(),
  related_party_email: z.string().email().optional().or(z.literal('')),
  related_party_phone: z.string().optional(),
  value: z.number({ coerce: true }).positive().optional(),
  start_date: z.string().datetime({ offset: true }).optional(),
  end_date: z.string().datetime({ offset: true }).optional(),
  html_content: z.string().min(1),
  field_values: z.record(z.unknown()).default({}),
  notes: z.string().optional(),
});

export const updateContractSchema = createContractSchema.partial();

export const updateStatusSchema = z.object({
  status: ContractStatusEnum,
  reason: z.string().optional(),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const generateAiSchema = z.object({
  title: z.string().min(1),
  relatedParty: z.string().min(1),
  contractType: z.string(),
  value: z.number().min(0),
  monthlyValue: z.number().optional().nullable(),
  consultantName: z.string().optional(),
  crea: z.string().optional(),
  extraInfo: z.string().optional(),
  relatedPartyDoc: z.string().optional(),
  responsibleName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  includeWitnesses: z.boolean().optional(),
  isRefinement: z.boolean().optional(),
  previousHtmlContent: z.string().optional(),
  refinementInstructions: z.string().optional(),
});

export type GenerateAiInput = z.infer<typeof generateAiSchema>;
