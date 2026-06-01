import { z } from 'zod';

export const sendSignatureSchema = z.object({
  channel: z.enum(['EMAIL', 'WHATSAPP', 'BOTH']),
  recipient_name: z.string().min(2),
  recipient_email: z.string().email().optional(),
  recipient_phone: z.string().optional(),
  expires_in_hours: z.number().int().positive().default(72),
});

export const confirmSignatureSchema = z.object({
  agreed: z.boolean().refine((v) => v === true, 'Deve concordar com o contrato'),
});

export type SendSignatureInput = z.infer<typeof sendSignatureSchema>;
export type ConfirmSignatureInput = z.infer<typeof confirmSignatureSchema>;
