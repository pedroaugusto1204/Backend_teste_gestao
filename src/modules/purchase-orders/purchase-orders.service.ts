import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppErrors } from '../../middlewares/error.middleware';
import { CreatePOInput, UpdatePOInput, ApproveInput } from './purchase-orders.schemas';
import { parsePagination, buildMeta, parseSorting } from '../../utils/pagination';
import { generatePONumber } from '../../utils/dateUtils';
import { Request } from 'express';

export class PurchaseOrdersService {
  /**
   * Get the next sequential PO number for a company.
   * Format: OC-{YEAR}-{SEQUENCE 4 digits}
   */
  async getNextNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OC-${year}-`;

    const lastPO = await prisma.purchaseOrder.findFirst({
      where: {
        company_id: companyId,
        number: { startsWith: prefix },
      },
      orderBy: { number: 'desc' },
    });

    let sequence = 1;
    if (lastPO) {
      const lastSeq = parseInt(lastPO.number.split('-')[2], 10);
      sequence = lastSeq + 1;
    }

    return generatePONumber(year, sequence);
  }

  async list(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const orderBy = parseSorting(req, ['createdAt', 'number', 'total', 'status']);
    const { search, status, obra_id } = req.query as Record<string, string>;

    const where: Prisma.PurchaseOrderWhereInput = {
      company_id: companyId,
      ...(status && { status: status as never }),
      ...(obra_id && { obra_id }),
      ...(search && {
        OR: [
          { number: { contains: search } },
          { title: { contains: search, mode: 'insensitive' } },
          { supplier: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          obra: { select: { id: true, name: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { pos, meta: buildMeta(total, page, limit) };
  }

  async findById(id: string, companyId: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, company_id: companyId },
      include: {
        obra: { select: { id: true, name: true, status: true } },
        uploads: true,
      },
    });
    if (!po) throw AppErrors.notFound('Ordem de compra não encontrada');
    return po;
  }

  async create(companyId: string, data: CreatePOInput) {
    const number = await this.getNextNumber(companyId);
    // Calculate total server-side as well
    const total = data.subtotal + data.taxes - data.discount;

    return prisma.purchaseOrder.create({
      data: {
        company_id: companyId,
        number,
        ...data,
        items: data.items as Prisma.InputJsonValue,
        subtotal: new Prisma.Decimal(data.subtotal),
        taxes: new Prisma.Decimal(data.taxes),
        discount: new Prisma.Decimal(data.discount),
        total: new Prisma.Decimal(total),
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        delivery_date: data.delivery_date ? new Date(data.delivery_date) : undefined,
      },
      include: { obra: { select: { id: true, name: true } } },
    });
  }

  async update(id: string, companyId: string, data: UpdatePOInput) {
    const existing = await this.findById(id, companyId);
    if (existing.status !== 'DRAFT') {
      throw AppErrors.forbidden('Apenas ordens em rascunho podem ser editadas');
    }

    const total =
      data.subtotal !== undefined && data.taxes !== undefined && data.discount !== undefined
        ? data.subtotal + data.taxes - data.discount
        : undefined;

    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...data,
        items: data.items ? (data.items as Prisma.InputJsonValue) : undefined,
        subtotal: data.subtotal ? new Prisma.Decimal(data.subtotal) : undefined,
        taxes: data.taxes !== undefined ? new Prisma.Decimal(data.taxes) : undefined,
        discount: data.discount !== undefined ? new Prisma.Decimal(data.discount) : undefined,
        total: total ? new Prisma.Decimal(total) : undefined,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        delivery_date: data.delivery_date ? new Date(data.delivery_date) : undefined,
      },
    });
  }

  async delete(id: string, companyId: string) {
    const existing = await this.findById(id, companyId);
    if (existing.status !== 'DRAFT') {
      throw AppErrors.forbidden('Apenas ordens em rascunho podem ser excluídas');
    }
    return prisma.purchaseOrder.delete({ where: { id } });
  }

  async updateStatus(id: string, companyId: string, status: string) {
    await this.findById(id, companyId);
    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: status as never },
    });
  }

  async approve(id: string, companyId: string, data: ApproveInput) {
    const existing = await this.findById(id, companyId);
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(existing.status)) {
      throw AppErrors.forbidden('Apenas ordens DRAFT ou PENDING_APPROVAL podem ser aprovadas');
    }
    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approved_by: data.approved_by,
        approved_at: new Date(),
      },
    });
  }
}
