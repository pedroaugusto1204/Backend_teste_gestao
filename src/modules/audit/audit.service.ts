import { prisma } from '../../config/database';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { Request } from 'express';

export class AuditService {
  async list(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const { entity_type, action, user_id, start_date, end_date } =
      req.query as Record<string, string>;

    const where = {
      company_id: companyId,
      ...(entity_type && { entity_type }),
      ...(action && { action }),
      ...(user_id && { user_id }),
      ...(start_date && { createdAt: { gte: new Date(start_date) } }),
      ...(end_date && { createdAt: { lte: new Date(end_date) } }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, meta: buildMeta(total, page, limit) };
  }
}
