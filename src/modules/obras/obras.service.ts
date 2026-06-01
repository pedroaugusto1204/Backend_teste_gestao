import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppErrors } from '../../middlewares/error.middleware';
import {
  CreateObraInput,
  UpdateObraInput,
  CreateStepInput,
  UpdateStepInput,
  CreateVistoriaInput,
  UpdateVistoriaInput,
  CreateCustoInput,
  UpdateCustoInput,
} from './obras.schemas';
import { parsePagination, buildMeta, parseSorting } from '../../utils/pagination';
import { Request } from 'express';

/** Default steps to seed for a new obra */
const DEFAULT_STEPS = [
  // PLANEJAMENTO
  { title: 'Projeto arquitetônico', phase: 'PLANEJAMENTO' as const, order: 1 },
  { title: 'Aprovações e alvarás', phase: 'PLANEJAMENTO' as const, order: 2 },
  { title: 'Orçamento detalhado', phase: 'PLANEJAMENTO' as const, order: 3 },
  // PRE_OBRA
  { title: 'Mobilização da equipe', phase: 'PRE_OBRA' as const, order: 4 },
  { title: 'Tapume e sinalização', phase: 'PRE_OBRA' as const, order: 5 },
  { title: 'Limpeza do terreno', phase: 'PRE_OBRA' as const, order: 6 },
  // FUNDACAO
  { title: 'Locação da obra', phase: 'FUNDACAO' as const, order: 7 },
  { title: 'Escavação', phase: 'FUNDACAO' as const, order: 8 },
  { title: 'Fundação', phase: 'FUNDACAO' as const, order: 9 },
  // ALVENARIA
  { title: 'Alvenaria estrutural', phase: 'ALVENARIA' as const, order: 10 },
  { title: 'Laje', phase: 'ALVENARIA' as const, order: 11 },
  { title: 'Cobertura', phase: 'ALVENARIA' as const, order: 12 },
  // INSTALACOES
  { title: 'Instalação elétrica', phase: 'INSTALACOES' as const, order: 13 },
  { title: 'Instalação hidráulica', phase: 'INSTALACOES' as const, order: 14 },
  { title: 'HVAC / Climatização', phase: 'INSTALACOES' as const, order: 15 },
  // ACABAMENTO
  { title: 'Revestimentos', phase: 'ACABAMENTO' as const, order: 16 },
  { title: 'Pintura', phase: 'ACABAMENTO' as const, order: 17 },
  { title: 'Esquadrias e louças', phase: 'ACABAMENTO' as const, order: 18 },
  // ENTREGA
  { title: 'Vistoria final', phase: 'ENTREGA' as const, order: 19 },
  { title: 'Documentação e habite-se', phase: 'ENTREGA' as const, order: 20 },
  { title: 'Entrega das chaves', phase: 'ENTREGA' as const, order: 21 },
];

/**
 * Recalculate obra's actual_cost and completion_pct.
 * Called after any cost or step change.
 */
async function recalculateObra(obraId: string) {
  const [costAgg, steps] = await Promise.all([
    prisma.obraCusto.aggregate({
      where: { obra_id: obraId },
      _sum: { value: true },
    }),
    prisma.obraStep.findMany({ where: { obra_id: obraId } }),
  ]);

  const actualCost = costAgg._sum.value ?? new Prisma.Decimal(0);

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === 'COMPLETED').length;
  const completionPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  await prisma.obra.update({
    where: { id: obraId },
    data: {
      actual_cost: actualCost,
      completion_pct: completionPct,
    },
  });
}

export class ObrasService {
  // ─────────────────────────── OBRAS ───────────────────────────

  async list(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const orderBy = parseSorting(req, ['createdAt', 'name', 'status', 'start_date', 'end_date']);
    const { search, status } = req.query as Record<string, string>;

    const where: Prisma.ObraWhereInput = {
      company_id: companyId,
      ...(status && { status: status as never }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { responsible: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [obras, total] = await Promise.all([
      prisma.obra.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { steps: true, custos: true, vistorias: true } },
        },
      }),
      prisma.obra.count({ where }),
    ]);

    return { obras, meta: buildMeta(total, page, limit) };
  }

  async findById(id: string, companyId: string) {
    const obra = await prisma.obra.findFirst({
      where: { id, company_id: companyId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        contract: { select: { id: true, title: true, type: true, status: true } },
        steps: { orderBy: { order: 'asc' } },
        vistorias: { orderBy: { date: 'desc' } },
        custos: { orderBy: { date: 'desc' } },
        purchaseOrders: { orderBy: { createdAt: 'desc' } },
        uploads: true,
      },
    });
    if (!obra) throw AppErrors.notFound('Obra não encontrada');
    return obra;
  }

  async create(companyId: string, userId: string, data: CreateObraInput) {
    const obra = await prisma.obra.create({
      data: {
        company_id: companyId,
        created_by: userId,
        ...data,
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
      },
    });
    return obra;
  }

  async update(id: string, companyId: string, data: UpdateObraInput) {
    await this.findById(id, companyId);
    return prisma.obra.update({
      where: { id },
      data: {
        ...data,
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
      },
    });
  }

  async delete(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.obra.delete({ where: { id } });
  }

  async updateStatus(id: string, companyId: string, status: string) {
    await this.findById(id, companyId);
    return prisma.obra.update({
      where: { id },
      data: { status: status as never },
    });
  }

  async getSummary(id: string, companyId: string) {
    const obra = await this.findById(id, companyId);

    const costsByCategory = await prisma.obraCusto.groupBy({
      by: ['category'],
      where: { obra_id: id },
      _sum: { value: true },
      _count: true,
    });

    const budget = obra.budget ? Number(obra.budget) : null;
    const actualCost = Number(obra.actual_cost);
    const variance = budget !== null ? budget - actualCost : null;
    const variancePct = budget && budget > 0 ? ((actualCost / budget) * 100).toFixed(1) : null;

    return {
      obra: {
        id: obra.id,
        name: obra.name,
        status: obra.status,
        completion_pct: obra.completion_pct,
      },
      financeiro: {
        budget,
        actual_cost: actualCost,
        variance,
        variance_pct: variancePct,
        over_budget: variance !== null && variance < 0,
      },
      costs_by_category: costsByCategory.map((c) => ({
        category: c.category,
        total: Number(c._sum.value ?? 0),
        count: c._count,
      })),
      steps_summary: {
        total: obra.steps.length,
        completed: obra.steps.filter((s) => s.status === 'COMPLETED').length,
        in_progress: obra.steps.filter((s) => s.status === 'IN_PROGRESS').length,
        blocked: obra.steps.filter((s) => s.status === 'BLOCKED').length,
      },
    };
  }

  // ─────────────────────────── STEPS ───────────────────────────

  async listSteps(obraId: string, companyId: string) {
    await this.findById(obraId, companyId);
    return prisma.obraStep.findMany({
      where: { obra_id: obraId },
      orderBy: { order: 'asc' },
    });
  }

  async createStep(obraId: string, companyId: string, data: CreateStepInput) {
    await this.findById(obraId, companyId);
    const step = await prisma.obraStep.create({
      data: {
        obra_id: obraId,
        ...data,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
      },
    });
    await recalculateObra(obraId);
    return step;
  }

  async updateStep(
    obraId: string,
    stepId: string,
    companyId: string,
    data: UpdateStepInput
  ) {
    await this.findById(obraId, companyId);
    const step = await prisma.obraStep.findFirst({
      where: { id: stepId, obra_id: obraId },
    });
    if (!step) throw AppErrors.notFound('Etapa não encontrada');

    const updatedData = {
      ...data,
      due_date: data.due_date ? new Date(data.due_date) : undefined,
      completed_at:
        data.status === 'COMPLETED' && !step.completed_at
          ? new Date()
          : data.completed_at
          ? new Date(data.completed_at)
          : undefined,
    };

    const updated = await prisma.obraStep.update({
      where: { id: stepId },
      data: updatedData,
    });
    await recalculateObra(obraId);
    return updated;
  }

  async deleteStep(obraId: string, stepId: string, companyId: string) {
    await this.findById(obraId, companyId);
    const step = await prisma.obraStep.findFirst({
      where: { id: stepId, obra_id: obraId },
    });
    if (!step) throw AppErrors.notFound('Etapa não encontrada');
    const deleted = await prisma.obraStep.delete({ where: { id: stepId } });
    await recalculateObra(obraId);
    return deleted;
  }

  async toggleStep(obraId: string, stepId: string, companyId: string) {
    await this.findById(obraId, companyId);
    const step = await prisma.obraStep.findFirst({
      where: { id: stepId, obra_id: obraId },
    });
    if (!step) throw AppErrors.notFound('Etapa não encontrada');

    const newStatus = step.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const updated = await prisma.obraStep.update({
      where: { id: stepId },
      data: {
        status: newStatus,
        completed_at: newStatus === 'COMPLETED' ? new Date() : null,
      },
    });
    await recalculateObra(obraId);
    return updated;
  }

  /**
   * Seed the 21 default steps for a given obra.
   * Idempotent: skips if steps already exist.
   */
  async seedSteps(obraId: string, companyId: string) {
    await this.findById(obraId, companyId);
    const existingCount = await prisma.obraStep.count({ where: { obra_id: obraId } });
    if (existingCount > 0) {
      return { message: 'Etapas já existem para esta obra', skipped: true };
    }

    const created = await prisma.obraStep.createMany({
      data: DEFAULT_STEPS.map((s) => ({ ...s, obra_id: obraId })),
    });

    await recalculateObra(obraId);
    return { created: created.count, steps: DEFAULT_STEPS.length };
  }

  // ──────────────────────── VISTORIAS ────────────────────────

  async listVistorias(obraId: string, companyId: string) {
    await this.findById(obraId, companyId);
    return prisma.obraVistoria.findMany({
      where: { obra_id: obraId },
      orderBy: { date: 'desc' },
    });
  }

  async createVistoria(
    obraId: string,
    companyId: string,
    data: CreateVistoriaInput
  ) {
    await this.findById(obraId, companyId);
    return prisma.obraVistoria.create({
      data: {
        obra_id: obraId,
        ...data,
        date: new Date(data.date),
        conditions: data.conditions as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findVistoriaById(obraId: string, vistoriaId: string, companyId: string) {
    await this.findById(obraId, companyId);
    const v = await prisma.obraVistoria.findFirst({
      where: { id: vistoriaId, obra_id: obraId },
      include: { uploads: true },
    });
    if (!v) throw AppErrors.notFound('Vistoria não encontrada');
    return v;
  }

  async updateVistoria(
    obraId: string,
    vistoriaId: string,
    companyId: string,
    data: UpdateVistoriaInput
  ) {
    await this.findVistoriaById(obraId, vistoriaId, companyId);
    return prisma.obraVistoria.update({
      where: { id: vistoriaId },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        conditions: data.conditions as Prisma.InputJsonValue | undefined,
      },
    });
  }

  // ─────────────────────────── CUSTOS ──────────────────────────

  async listCustos(obraId: string, companyId: string, req: Request) {
    await this.findById(obraId, companyId);
    const { page, limit, skip } = parsePagination(req);
    const category = req.query.category as string | undefined;

    const where = {
      obra_id: obraId,
      ...(category && { category: category as never }),
    };

    const [custos, total, totalValue] = await Promise.all([
      prisma.obraCusto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.obraCusto.count({ where }),
      prisma.obraCusto.aggregate({
        where: { obra_id: obraId },
        _sum: { value: true },
      }),
    ]);

    return {
      custos,
      meta: buildMeta(total, page, limit),
      total_value: Number(totalValue._sum.value ?? 0),
    };
  }

  async createCusto(obraId: string, companyId: string, data: CreateCustoInput) {
    await this.findById(obraId, companyId);
    const custo = await prisma.obraCusto.create({
      data: {
        obra_id: obraId,
        ...data,
        value: new Prisma.Decimal(data.value),
        date: new Date(data.date),
        paid_at: data.paid_at ? new Date(data.paid_at) : undefined,
      },
    });
    await recalculateObra(obraId);
    return custo;
  }

  async updateCusto(
    obraId: string,
    custoId: string,
    companyId: string,
    data: UpdateCustoInput
  ) {
    await this.findById(obraId, companyId);
    const custo = await prisma.obraCusto.findFirst({
      where: { id: custoId, obra_id: obraId },
    });
    if (!custo) throw AppErrors.notFound('Custo não encontrado');

    const updated = await prisma.obraCusto.update({
      where: { id: custoId },
      data: {
        ...data,
        value: data.value ? new Prisma.Decimal(data.value) : undefined,
        date: data.date ? new Date(data.date) : undefined,
        paid_at: data.paid_at ? new Date(data.paid_at) : undefined,
      },
    });
    await recalculateObra(obraId);
    return updated;
  }

  async deleteCusto(obraId: string, custoId: string, companyId: string) {
    await this.findById(obraId, companyId);
    const custo = await prisma.obraCusto.findFirst({
      where: { id: custoId, obra_id: obraId },
    });
    if (!custo) throw AppErrors.notFound('Custo não encontrado');
    const deleted = await prisma.obraCusto.delete({ where: { id: custoId } });
    await recalculateObra(obraId);
    return deleted;
  }

  async getCostReport(obraId: string, companyId: string) {
    await this.findById(obraId, companyId);

    const [byCategory, byPaymentStatus, monthly] = await Promise.all([
      prisma.obraCusto.groupBy({
        by: ['category'],
        where: { obra_id: obraId },
        _sum: { value: true },
        _count: true,
      }),
      prisma.obraCusto.groupBy({
        by: ['payment_status'],
        where: { obra_id: obraId },
        _sum: { value: true },
        _count: true,
      }),
      prisma.obraCusto.findMany({
        where: { obra_id: obraId },
        orderBy: { date: 'asc' },
        select: { date: true, value: true, category: true, description: true },
      }),
    ]);

    return {
      by_category: byCategory.map((c) => ({
        category: c.category,
        total: Number(c._sum.value ?? 0),
        count: c._count,
      })),
      by_payment_status: byPaymentStatus.map((c) => ({
        status: c.payment_status,
        total: Number(c._sum.value ?? 0),
        count: c._count,
      })),
      timeline: monthly,
    };
  }

  // ─────────────────────────── KPIs ────────────────────────────

  async getDashboardKPIs(companyId: string) {
    const [obrasAtivas, budgetAgg, completion, alertas] = await Promise.all([
      prisma.obra.count({
        where: { company_id: companyId, status: 'IN_PROGRESS' },
      }),
      prisma.obra.aggregate({
        where: { company_id: companyId },
        _sum: { budget: true, actual_cost: true },
        _avg: { completion_pct: true },
      }),
      prisma.obra.findMany({
        where: { company_id: companyId },
        select: { completion_pct: true, status: true },
      }),
      // Obras with cost > budget (over-budget alert)
      prisma.obra.findMany({
        where: {
          company_id: companyId,
          status: { in: ['IN_PROGRESS', 'PLANNING'] },
        },
        select: { id: true, name: true, budget: true, actual_cost: true },
      }),
    ]);

    const overBudget = alertas.filter(
      (o) => o.budget && Number(o.actual_cost) > Number(o.budget)
    );

    const byStatus = await prisma.obra.groupBy({
      by: ['status'],
      where: { company_id: companyId },
      _count: true,
    });

    return {
      obras_ativas: obrasAtivas,
      budget_total: Number(budgetAgg._sum.budget ?? 0),
      custo_realizado_total: Number(budgetAgg._sum.actual_cost ?? 0),
      media_conclusao: Math.round(budgetAgg._avg.completion_pct ?? 0),
      over_budget_count: overBudget.length,
      over_budget_obras: overBudget,
      by_status: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
    };
  }
}
