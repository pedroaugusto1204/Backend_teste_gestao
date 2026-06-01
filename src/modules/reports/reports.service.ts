import { prisma } from '../../config/database';
import { daysUntil } from '../../utils/dateUtils';
import { Request } from 'express';

export class ReportsService {
  async contractsOverview(companyId: string) {
    const now = new Date();

    const [total, byStatus, byType, monthlyCreated, totalValue] =
      await Promise.all([
        prisma.contract.count({ where: { company_id: companyId } }),
        prisma.contract.groupBy({
          by: ['status'],
          where: { company_id: companyId },
          _count: true,
          _sum: { value: true },
        }),
        prisma.contract.groupBy({
          by: ['type'],
          where: { company_id: companyId },
          _count: true,
          _sum: { value: true },
        }),
        prisma.contract.findMany({
          where: { company_id: companyId },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.contract.aggregate({
          where: { company_id: companyId },
          _sum: { value: true },
        }),
      ]);

    return {
      total,
      total_value: Number(totalValue._sum.value ?? 0),
      by_status: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        value: Number(s._sum.value ?? 0),
      })),
      by_type: byType.map((t) => ({
        type: t.type,
        count: t._count,
        value: Number(t._sum.value ?? 0),
      })),
      created_over_time: monthlyCreated,
      generated_at: now,
    };
  }

  async contractsExpiring(companyId: string, req: Request) {
    const days = parseInt((req.query.days as string) ?? '30', 10);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const contracts = await prisma.contract.findMany({
      where: {
        company_id: companyId,
        end_date: { gte: now, lte: futureDate },
        status: { notIn: ['CANCELLED', 'ARCHIVED', 'DRAFT'] },
      },
      include: {
        creator: { select: { name: true, email: true } },
      },
      orderBy: { end_date: 'asc' },
    });

    return contracts.map((c) => ({
      ...c,
      days_remaining: c.end_date ? daysUntil(c.end_date) : null,
    }));
  }

  async obrasFinancial(companyId: string) {
    const obras = await prisma.obra.findMany({
      where: { company_id: companyId },
      include: {
        _count: { select: { custos: true } },
      },
    });

    const result = obras.map((o) => ({
      id: o.id,
      name: o.name,
      status: o.status,
      budget: Number(o.budget ?? 0),
      actual_cost: Number(o.actual_cost),
      variance: Number(o.budget ?? 0) - Number(o.actual_cost),
      over_budget: o.budget !== null && Number(o.actual_cost) > Number(o.budget),
      completion_pct: o.completion_pct,
      custo_count: o._count.custos,
    }));

    const totals = {
      total_budget: result.reduce((a, o) => a + o.budget, 0),
      total_actual: result.reduce((a, o) => a + o.actual_cost, 0),
      total_variance: result.reduce((a, o) => a + o.variance, 0),
      over_budget_count: result.filter((o) => o.over_budget).length,
    };

    return { obras: result, totals };
  }

  async obrasStatus(companyId: string) {
    const [byStatus, avgCompletion] = await Promise.all([
      prisma.obra.groupBy({
        by: ['status'],
        where: { company_id: companyId },
        _count: true,
      }),
      prisma.obra.aggregate({
        where: { company_id: companyId, status: 'IN_PROGRESS' },
        _avg: { completion_pct: true },
      }),
    ]);

    return {
      by_status: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      avg_completion_in_progress: Math.round(avgCompletion._avg.completion_pct ?? 0),
    };
  }

  async purchaseOrdersSummary(companyId: string) {
    const [byStatus, byObra, totalValue] = await Promise.all([
      prisma.purchaseOrder.groupBy({
        by: ['status'],
        where: { company_id: companyId },
        _count: true,
        _sum: { total: true },
      }),
      prisma.purchaseOrder.groupBy({
        by: ['obra_id'],
        where: { company_id: companyId },
        _count: true,
        _sum: { total: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: { company_id: companyId },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    return {
      total_pos: totalValue._count,
      total_value: Number(totalValue._sum.total ?? 0),
      by_status: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
        value: Number(s._sum.total ?? 0),
      })),
      by_obra: byObra,
    };
  }

  async consolidatedDashboard(companyId: string) {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      contractKpis,
      obraKpis,
      poKpis,
      recentActivity,
    ] = await Promise.all([
      // Contracts
      Promise.all([
        prisma.contract.count({ where: { company_id: companyId } }),
        prisma.contract.count({
          where: {
            company_id: companyId,
            status: { notIn: ['CANCELLED', 'ARCHIVED', 'DRAFT'] },
          },
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
      ]),
      // Obras
      Promise.all([
        prisma.obra.count({ where: { company_id: companyId, status: 'IN_PROGRESS' } }),
        prisma.obra.aggregate({
          where: { company_id: companyId },
          _avg: { completion_pct: true },
          _sum: { budget: true, actual_cost: true },
        }),
      ]),
      // POs
      Promise.all([
        prisma.purchaseOrder.count({ where: { company_id: companyId } }),
        prisma.purchaseOrder.aggregate({
          where: { company_id: companyId },
          _sum: { total: true },
        }),
        prisma.purchaseOrder.count({
          where: { company_id: companyId, status: 'PENDING_APPROVAL' },
        }),
      ]),
      // Recent audit logs
      prisma.auditLog.findMany({
        where: { company_id: companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
    ]);

    return {
      contracts: {
        total: contractKpis[0],
        active: contractKpis[1],
        expiring_soon: contractKpis[2],
        pending_signature: contractKpis[3],
      },
      obras: {
        in_progress: obraKpis[0],
        avg_completion: Math.round(obraKpis[1]._avg.completion_pct ?? 0),
        total_budget: Number(obraKpis[1]._sum.budget ?? 0),
        total_spent: Number(obraKpis[1]._sum.actual_cost ?? 0),
      },
      purchase_orders: {
        total: poKpis[0],
        total_value: Number(poKpis[1]._sum.total ?? 0),
        pending_approval: poKpis[2],
      },
      recent_activity: recentActivity,
      generated_at: now,
    };
  }
}
