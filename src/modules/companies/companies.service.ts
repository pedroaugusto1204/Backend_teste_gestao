import { prisma } from '../../config/database';
import { AppErrors } from '../../middlewares/error.middleware';
import { CreateCompanyInput, UpdateCompanyInput } from './companies.schemas';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { Request } from 'express';

export class CompaniesService {
  async list(req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search as string | undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { cnpj: { contains: search } },
          ],
        }
      : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          cnpj: true,
          email: true,
          phone: true,
          active: true,
          logo_url: true,
          createdAt: true,
          _count: { select: { users: true, contracts: true } },
        },
      }),
      prisma.company.count({ where }),
    ]);

    return { companies, meta: buildMeta(total, page, limit) };
  }

  async findById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, contracts: true, obras: true } },
      },
    });
    if (!company) throw AppErrors.notFound('Empresa não encontrada');
    return company;
  }

  async create(data: CreateCompanyInput) {
    const existing = await prisma.company.findUnique({
      where: { cnpj: data.cnpj },
    });
    if (existing) throw AppErrors.conflict('CNPJ já cadastrado');

    return prisma.company.create({ data });
  }

  async update(id: string, data: UpdateCompanyInput) {
    await this.findById(id);
    return prisma.company.update({ where: { id }, data });
  }
}
