import { prisma } from '../../config/database';
import { AppErrors } from '../../middlewares/error.middleware';
import { SendSignatureInput, ConfirmSignatureInput } from './signatures.schemas';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { addDays } from '../../utils/dateUtils';
import { env } from '../../config/env';
import { Request } from 'express';

/** Simulate email sending — logs to console with full link */
function simulateEmail(params: {
  to: string;
  recipientName: string;
  contractTitle: string;
  signLink: string;
}) {
  console.log('\n📧 [SIMULAÇÃO EMAIL] ─────────────────────────────────');
  console.log(`  Para:     ${params.to}`);
  console.log(`  Nome:     ${params.recipientName}`);
  console.log(`  Contrato: ${params.contractTitle}`);
  console.log(`  Link:     ${params.signLink}`);
  console.log('──────────────────────────────────────────────────────\n');
}

/** Simulate WhatsApp sending — logs to console with full link */
function simulateWhatsApp(params: {
  phone: string;
  recipientName: string;
  contractTitle: string;
  signLink: string;
}) {
  console.log('\n💬 [SIMULAÇÃO WHATSAPP] ──────────────────────────────');
  console.log(`  Telefone: ${params.phone}`);
  console.log(`  Nome:     ${params.recipientName}`);
  console.log(`  Contrato: ${params.contractTitle}`);
  console.log(`  Link:     ${params.signLink}`);
  console.log(`  Mensagem: Olá ${params.recipientName}, você recebeu um contrato para assinar: ${params.signLink}`);
  console.log('──────────────────────────────────────────────────────\n');
}

export class SignaturesService {
  async list(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const status = req.query.status as string | undefined;

    const where = {
      contract: { company_id: companyId },
      ...(status && { status: status as never }),
    };

    const [requests, total] = await Promise.all([
      prisma.signatureRequest.findMany({
        where,
        include: {
          contract: { select: { id: true, title: true, type: true, status: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.signatureRequest.count({ where }),
    ]);

    return { requests, meta: buildMeta(total, page, limit) };
  }

  async findById(id: string, companyId: string) {
    const req = await prisma.signatureRequest.findFirst({
      where: { id, contract: { company_id: companyId } },
      include: {
        contract: {
          select: { id: true, title: true, type: true, status: true, html_content: true },
        },
      },
    });
    if (!req) throw AppErrors.notFound('Solicitação de assinatura não encontrada');
    return req;
  }

  /**
   * Send a contract for signature via email, WhatsApp, or both.
   * Creates a SignatureRequest and simulates delivery.
   */
  async send(contractId: string, companyId: string, input: SendSignatureInput) {
    // Verify contract belongs to tenant
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, company_id: companyId },
    });
    if (!contract) throw AppErrors.notFound('Contrato não encontrado');
    if (contract.status === 'CANCELLED' || contract.status === 'ARCHIVED') {
      throw AppErrors.forbidden('Não é possível enviar contratos cancelados ou arquivados');
    }

    const expiresAt = addDays(new Date(), Math.ceil(input.expires_in_hours / 24));

    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        contract_id: contractId,
        channel: input.channel as never,
        status: 'PENDING',
        recipient_name: input.recipient_name,
        recipient_email: input.recipient_email,
        recipient_phone: input.recipient_phone,
        expires_at: expiresAt,
      },
    });

    // Update contract to PENDING_SIGNATURE
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'PENDING_SIGNATURE' },
    });

    const signLink = `${env.FRONTEND_URL}/sign/${signatureRequest.token}`;

    // Simulate sending
    if (['EMAIL', 'BOTH'].includes(input.channel) && input.recipient_email) {
      simulateEmail({
        to: input.recipient_email,
        recipientName: input.recipient_name,
        contractTitle: contract.title,
        signLink,
      });
    }

    if (['WHATSAPP', 'BOTH'].includes(input.channel) && input.recipient_phone) {
      simulateWhatsApp({
        phone: input.recipient_phone,
        recipientName: input.recipient_name,
        contractTitle: contract.title,
        signLink,
      });
    }

    // Mark as SENT
    const updated = await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: { status: 'SENT', sent_at: new Date() },
    });

    return { signatureRequest: updated, sign_link: signLink };
  }

  async resend(id: string, companyId: string) {
    const sigReq = await this.findById(id, companyId);

    if (sigReq.status === 'SIGNED') {
      throw AppErrors.forbidden('Assinatura já realizada');
    }
    if (sigReq.status === 'CANCELLED') {
      throw AppErrors.forbidden('Solicitação cancelada');
    }

    // Extend expiry by 72 hours
    const newExpiry = addDays(new Date(), 3);
    const signLink = `${env.FRONTEND_URL}/sign/${sigReq.token}`;

    if (sigReq.recipient_email && ['EMAIL', 'BOTH'].includes(sigReq.channel)) {
      simulateEmail({
        to: sigReq.recipient_email,
        recipientName: sigReq.recipient_name,
        contractTitle: sigReq.contract.title,
        signLink,
      });
    }

    if (sigReq.recipient_phone && ['WHATSAPP', 'BOTH'].includes(sigReq.channel)) {
      simulateWhatsApp({
        phone: sigReq.recipient_phone,
        recipientName: sigReq.recipient_name,
        contractTitle: sigReq.contract.title,
        signLink,
      });
    }

    return prisma.signatureRequest.update({
      where: { id },
      data: { status: 'SENT', sent_at: new Date(), expires_at: newExpiry },
    });
  }

  async cancel(id: string, companyId: string) {
    const sigReq = await this.findById(id, companyId);
    if (sigReq.status === 'SIGNED') {
      throw AppErrors.forbidden('Não é possível cancelar uma assinatura já realizada');
    }
    return prisma.signatureRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Public: Get signature request details for the sign page (no auth).
   */
  async getPublicSignPage(token: string) {
    const sigReq = await prisma.signatureRequest.findUnique({
      where: { token },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            type: true,
            html_content: true,
            value: true,
            start_date: true,
            end_date: true,
            related_party: true,
          },
        },
      },
    });

    if (!sigReq) throw AppErrors.notFound('Link de assinatura inválido');

    // Mark as viewed if first time
    if (!sigReq.viewed_at) {
      await prisma.signatureRequest.update({
        where: { id: sigReq.id },
        data: { status: 'VIEWED', viewed_at: new Date() },
      });
    }

    if (sigReq.status === 'SIGNED') {
      return { ...sigReq, already_signed: true };
    }

    if (new Date() > sigReq.expires_at) {
      await prisma.signatureRequest.update({
        where: { id: sigReq.id },
        data: { status: 'EXPIRED' },
      });
      throw AppErrors.forbidden('Link de assinatura expirado');
    }

    return { ...sigReq, already_signed: false };
  }

  /**
   * Public: Confirm signature (no auth).
   * Validates token, records signature, checks if all parties signed.
   */
  async confirmSignature(
    token: string,
    _input: ConfirmSignatureInput,
    ipAddress: string,
    userAgent: string
  ) {
    const sigReq = await prisma.signatureRequest.findUnique({
      where: { token },
      include: { contract: true },
    });

    if (!sigReq) throw AppErrors.notFound('Link de assinatura inválido');
    if (sigReq.status === 'SIGNED') throw AppErrors.conflict('Assinatura já realizada');
    if (sigReq.status === 'CANCELLED') throw AppErrors.forbidden('Solicitação cancelada');
    if (new Date() > sigReq.expires_at) throw AppErrors.forbidden('Link de assinatura expirado');

    const now = new Date();

    // Record the signature
    const updatedSig = await prisma.signatureRequest.update({
      where: { id: sigReq.id },
      data: {
        status: 'SIGNED',
        signed_at: now,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    // Check if ALL signature requests for this contract are now signed
    const [total, signedCount] = await Promise.all([
      prisma.signatureRequest.count({
        where: { contract_id: sigReq.contract_id },
      }),
      prisma.signatureRequest.count({
        where: { contract_id: sigReq.contract_id, status: 'SIGNED' },
      }),
    ]);

    let contractUpdated = false;
    if (total === signedCount) {
      // All parties signed → move contract to SIGNED/ACTIVE
      await prisma.contract.update({
        where: { id: sigReq.contract_id },
        data: { status: 'SIGNED', signed_at: now },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          company_id: sigReq.contract.company_id,
          entity_type: 'Contract',
          entity_id: sigReq.contract_id,
          action: 'SIGN',
          ip_address: ipAddress,
          user_agent: userAgent,
          new_value: { signed_by: sigReq.recipient_name, signed_at: now },
        },
      });

      contractUpdated = true;
      console.log(`\n✅ [ASSINATURA COMPLETA] Contrato "${sigReq.contract.title}" totalmente assinado por todas as partes!\n`);
    }

    return {
      message: 'Assinatura registrada com sucesso',
      all_parties_signed: contractUpdated,
      signed_at: now,
      recipient: sigReq.recipient_name,
    };
  }
}
