import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppErrors } from '../../middlewares/error.middleware';
import {
  CreateContractInput,
  UpdateContractInput,
  UpdateStatusInput,
  GenerateAiInput,
} from './contracts.schemas';
import { parsePagination, buildMeta, parseSorting } from '../../utils/pagination';
import { daysUntil, isExpiringSoon, isExpired } from '../../utils/dateUtils';
import { Request } from 'express';

const CONTRACT_INCLUDE = {
  creator: { select: { id: true, name: true, email: true } },
  template: { select: { id: true, name: true, type: true } },
  _count: { select: { signatureRequests: true, uploads: true } },
};

/** Enrich a contract with computed vigência fields */
function enrichContract<T extends { end_date?: Date | null; status: string }>(c: T) {
  const days = c.end_date ? daysUntil(c.end_date) : null;
  return {
    ...c,
    vigencia_restante: days,
    computed_status: computeStatus(c.status, c.end_date ?? null),
  };
}

/** Calculate effective status considering expiry dates */
function computeStatus(
  dbStatus: string,
  endDate: Date | null
): string {
  if (['CANCELLED', 'ARCHIVED', 'DRAFT'].includes(dbStatus)) return dbStatus;
  if (endDate && isExpired(endDate)) return 'EXPIRED';
  if (endDate && isExpiringSoon(endDate)) return 'EXPIRING_SOON';
  return dbStatus;
}

export class ContractsService {
  async list(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const orderBy = parseSorting(req, ['createdAt', 'title', 'value', 'end_date', 'status']);
    const { search, status, type, start_date, end_date } = req.query as Record<string, string>;

    const where: Prisma.ContractWhereInput = {
      company_id: companyId,
      ...(type && { type: type as never }),
      ...(status && { status: status as never }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { related_party: { contains: search, mode: 'insensitive' } },
          { related_party_doc: { contains: search } },
        ],
      }),
      ...(start_date && { createdAt: { gte: new Date(start_date) } }),
      ...(end_date && { end_date: { lte: new Date(end_date) } }),
    };

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: CONTRACT_INCLUDE,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      contracts: contracts.map(enrichContract),
      meta: buildMeta(total, page, limit),
    };
  }

  async findById(id: string, companyId: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, company_id: companyId },
      include: {
        ...CONTRACT_INCLUDE,
        signatureRequests: { orderBy: { createdAt: 'desc' } },
        obras: { select: { id: true, name: true, status: true } },
        uploads: true,
      },
    });
    if (!contract) throw AppErrors.notFound('Contrato não encontrado');

    const auditLogs = await prisma.auditLog.findMany({
      where: { entity_id: id, entity_type: 'Contract' },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...enrichContract(contract),
      auditLogs,
    };
  }

  async create(companyId: string, userId: string, data: CreateContractInput) {
    const contract = await prisma.contract.create({
      data: {
        company_id: companyId,
        created_by: userId,
        ...data,
        value: data.value ? new Prisma.Decimal(data.value) : undefined,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        field_values: data.field_values as Prisma.InputJsonValue,
      },
      include: CONTRACT_INCLUDE,
    });

    // Criar Obra automaticamente atrelada a este contrato
    const initialObraStatus = contract.status === 'PENDING_SIGNATURE' ? 'PENDING_SIGNATURE' : 'PLANNING';
    await prisma.obra.create({
      data: {
        company_id: companyId,
        created_by: userId,
        contract_id: contract.id,
        name: contract.title,
        status: initialObraStatus as never,
        budget: contract.value,
        start_date: contract.start_date,
        end_date: contract.end_date,
      }
    });

    return enrichContract(contract);
  }

  async update(id: string, companyId: string, data: UpdateContractInput) {
    const existing = await this.findById(id, companyId);
    if (existing.status !== 'DRAFT') {
      throw AppErrors.forbidden('Apenas contratos em rascunho podem ser editados');
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        ...data,
        value: data.value ? new Prisma.Decimal(data.value) : undefined,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        field_values: data.field_values as Prisma.InputJsonValue | undefined,
      },
      include: CONTRACT_INCLUDE,
    });
    return enrichContract(updated);
  }

  async delete(id: string, companyId: string) {
    const existing = await this.findById(id, companyId);
    if (existing.status !== 'DRAFT') {
      throw AppErrors.forbidden('Apenas contratos em rascunho podem ser excluídos');
    }
    return prisma.contract.delete({ where: { id } });
  }

  async updateStatus(id: string, companyId: string, data: UpdateStatusInput) {
    await this.findById(id, companyId);
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: {
        status: data.status as never,
        ...(data.status === 'ARCHIVED' && { archived_at: new Date() }),
        ...(data.status === 'SIGNED' && { signed_at: new Date() }),
        ...(data.status === 'ACTIVE' && { signed_at: new Date() }),
      },
      include: CONTRACT_INCLUDE,
    });

    // Sincronizar o status da Obra atrelada
    const linkedObra = await prisma.obra.findFirst({ where: { contract_id: id } });
    if (linkedObra) {
      let newObraStatus = linkedObra.status;
      if (data.status === 'PENDING_SIGNATURE') {
        newObraStatus = 'PENDING_SIGNATURE' as never;
      } else if (data.status === 'SIGNED' || data.status === 'ACTIVE') {
        newObraStatus = 'IN_PROGRESS' as never;
      } else if (data.status === 'CANCELLED') {
        newObraStatus = 'CANCELLED' as never;
      }

      if (newObraStatus !== linkedObra.status) {
        await prisma.obra.update({
          where: { id: linkedObra.id },
          data: { status: newObraStatus as never }
        });
      }
    }

    return updatedContract;
  }

  /**
   * Clone contract to create a renewal with a new period.
   */
  async renew(id: string, companyId: string, userId: string) {
    const original = await this.findById(id, companyId);
    const renewal = await prisma.contract.create({
      data: {
        company_id: companyId,
        created_by: userId,
        template_id: original.template_id ?? undefined,
        title: `[RENOVAÇÃO] ${original.title}`,
        type: original.type as never,
        status: 'DRAFT',
        related_party: original.related_party,
        related_party_doc: original.related_party_doc ?? undefined,
        related_party_email: original.related_party_email ?? undefined,
        related_party_phone: original.related_party_phone ?? undefined,
        value: original.value ?? undefined,
        html_content: original.html_content,
        field_values: original.field_values as Prisma.InputJsonValue,
        notes: `Renovação do contrato #${original.id}`,
      },
      include: CONTRACT_INCLUDE,
    });
    return enrichContract(renewal);
  }

  /**
   * Create an addendum (aditivo) as a new DRAFT contract referencing the original.
   */
  async addendum(id: string, companyId: string, userId: string) {
    const original = await this.findById(id, companyId);
    const aditivo = await prisma.contract.create({
      data: {
        company_id: companyId,
        created_by: userId,
        template_id: original.template_id ?? undefined,
        title: `[ADITIVO] ${original.title}`,
        type: original.type as never,
        status: 'DRAFT',
        related_party: original.related_party,
        related_party_doc: original.related_party_doc ?? undefined,
        related_party_email: original.related_party_email ?? undefined,
        related_party_phone: original.related_party_phone ?? undefined,
        html_content: original.html_content,
        field_values: original.field_values as Prisma.InputJsonValue,
        notes: `Aditivo do contrato #${original.id}`,
      },
      include: CONTRACT_INCLUDE,
    });
    return enrichContract(aditivo);
  }

  /**
   * Dashboard KPIs for contracts.
   */
  async getKPIs(companyId: string) {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [total, byStatus, expiringSoon, pendingSig, totalValue] =
      await Promise.all([
        prisma.contract.count({ where: { company_id: companyId } }),
        prisma.contract.groupBy({
          by: ['status'],
          where: { company_id: companyId },
          _count: true,
        }),
        prisma.contract.count({
          where: {
            company_id: companyId,
            end_date: { gte: now, lte: in30Days },
            status: { notIn: ['CANCELLED', 'ARCHIVED'] },
          },
        }),
        prisma.contract.count({
          where: { company_id: companyId, status: 'PENDING_SIGNATURE' },
        }),
        prisma.contract.aggregate({
          where: {
            company_id: companyId,
            status: { in: ['ACTIVE', 'SIGNED', 'EXPIRING_SOON'] },
          },
          _sum: { value: true },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusMap[s.status] = s._count;
    });

    return {
      total,
      by_status: statusMap,
      expiring_soon: expiringSoon,
      pending_signature: pendingSig,
      total_active_value: totalValue._sum.value ?? 0,
    };
  }

  /**
   * Active contracts manager — returns active contracts with computed vigência.
   */
  async getActiveManager(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const now = new Date();

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where: {
          company_id: companyId,
          status: { notIn: ['DRAFT', 'CANCELLED', 'ARCHIVED'] },
        },
        include: CONTRACT_INCLUDE,
        skip,
        take: limit,
        orderBy: { end_date: 'asc' },
      }),
      prisma.contract.count({
        where: {
          company_id: companyId,
          status: { notIn: ['DRAFT', 'CANCELLED', 'ARCHIVED'] },
        },
      }),
    ]);

    return {
      contracts: contracts
        .map(enrichContract)
        .map((c) => ({
          ...c,
          alert_level:
            c.vigencia_restante !== null
              ? c.vigencia_restante < 0
                ? 'EXPIRED'
                : c.vigencia_restante < 15
                ? 'CRITICAL'
                : c.vigencia_restante < 30
                ? 'WARNING'
                : 'OK'
              : 'NO_EXPIRY',
        })),
      meta: buildMeta(total, page, limit),
      generated_at: now,
    };
  }

  /**
   * Generates an AI contract using Groq API
   */
  async generateAiContract(companyId: string, data: GenerateAiInput) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw AppErrors.notFound('Empresa não encontrada');

    // Use company key, or fallback to env key
    const apiKey = (company as any).groq_api_key || process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw AppErrors.badRequest('Chave da API da Groq não configurada no backend nem na Empresa.');
    }

    let prompt = '';

    if (data.isRefinement && data.previousHtmlContent && data.refinementInstructions) {
      prompt = `
      Você é um assistente jurídico experiente corporativo revisando um contrato.
      Abaixo está o código HTML do contrato atual e, em seguida, as instruções do usuário para refinamento.
      
      INSTRUÇÕES DE FORMATAÇÃO:
      - O contrato DEVE ser retornado APENAS em formato HTML válido, pronto para ser inserido dentro de uma <div> no frontend.
      - NUNCA retorne blocos de código Markdown (como \`\`\`html ou \`\`\`). Retorne apenas o código HTML cru!
      - Não inclua as tags <html>, <head> ou <body>. Apenas o conteúdo interno.
      - Mantenha a estilização inline elegante existente, a menos que a instrução peça para alterar.

      INSTRUÇÕES DE REFINAMENTO DO USUÁRIO:
      ${data.refinementInstructions}

      CONTRATO ATUAL (HTML):
      ${data.previousHtmlContent}

      Retorne APENAS a nova versão do HTML do contrato completo (não retorne apenas a parte que mudou, retorne TUDO com as mudanças aplicadas).
      `;
    } else {
      prompt = `
      Você é um assistente jurídico experiente corporativo. Crie um contrato formal, detalhado e profissional baseado nos seguintes dados:
      - Título do Contrato / Objeto: ${data.title}
      - Contratante: ${company.name} (CNPJ: ${company.cnpj})
      - Contratada / Parte Relacionada: ${data.relatedParty} ${data.relatedPartyDoc ? `(CNPJ/CPF: ${data.relatedPartyDoc})` : ''}
      - Tipo de Contrato: ${data.contractType}
      - Valor Global: R$ ${data.value}
      ${data.monthlyValue ? `- Valor da Parcela Mensal: R$ ${data.monthlyValue}` : ''}
      ${data.responsibleName ? `- Responsável da Contratada: ${data.responsibleName}` : ''}
      ${data.consultantName ? `- Nome do Consultor (se houver): ${data.consultantName}` : ''}
      ${data.email ? `- E-mail: ${data.email}` : ''}
      ${data.phone ? `- Telefone: ${data.phone}` : ''}
      ${data.crea ? `- Registro do CREA/CAU: ${data.crea}` : ''}
      ${data.extraInfo ? `- Informações Adicionais/Contexto/Cláusulas Extras: ${data.extraInfo}` : ''}
      
      INSTRUÇÕES DE FORMATAÇÃO (MUITO IMPORTANTE):
      - O contrato DEVE ser retornado APENAS em formato HTML válido, pronto para ser inserido dentro de uma <div> no frontend.
      - NUNCA retorne blocos de código Markdown (como \`\`\`html ou \`\`\`). Retorne apenas o código HTML cru!
      - Não inclua as tags <html>, <head> ou <body>. Apenas o conteúdo interno.
      - Utilize tags HTML semânticas e estilos inline elegantes (estilo corporativo com fonte padrão): <h2>, <h3>, <p>, <strong>, <em>.
      - Crie h2 para o título do contrato, centralizado.
      - Crie h3 para os títulos das Cláusulas, usando um tom de azul escuro (ex: color: #1e3a5f) e margem superior.
      ${data.includeWitnesses ? '- Crie uma seção de assinaturas ao final do documento com espaços e linhas para "CONTRATANTE", "CONTRATADA" e 2 "Testemunhas", utilizando divs dispostas lado a lado.' : '- Crie uma seção de assinaturas ao final do documento APENAS com espaços e linhas para "CONTRATANTE" e "CONTRATADA". NÃO INCLUA ESPAÇO PARA TESTEMUNHAS.'}
      - Redija as cláusulas de forma clara, técnica e legalmente consistente.
      `;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', errText);
      throw AppErrors.internal('Falha na IA: ' + errText);
    }

    const json = await response.json() as any;
    let html = json.choices[0].message.content;
    html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');

    return { htmlContent: html };
  }

  /**
   * Sets up the AI API Key for the company
   */
  async setupAiContract(companyId: string, apiKey: string) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw AppErrors.badRequest('Chave inválida');
    }
    
    await prisma.company.update({
      where: { id: companyId },
      data: { groq_api_key: apiKey.trim() }
    });
    
    return { success: true };
  }
}
