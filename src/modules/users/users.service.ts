import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { AppErrors } from '../../middlewares/error.middleware';
import {
  CreateUserInput,
  UpdateUserInput,
  ChangePasswordInput,
} from './users.schemas';
import { parsePagination, buildMeta } from '../../utils/pagination';
import { Request } from 'express';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  company_id: true,
  createdAt: true,
  updatedAt: true,
};

export class UsersService {
  async list(companyId: string, req: Request) {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search as string | undefined;

    const where = {
      company_id: companyId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: buildMeta(total, page, limit) };
  }

  async findById(id: string, companyId: string) {
    const user = await prisma.user.findFirst({
      where: { id, company_id: companyId },
      select: USER_SELECT,
    });
    if (!user) throw AppErrors.notFound('Usuário não encontrado');
    return user;
  }

  async create(companyId: string, data: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email_company_id: { email: data.email, company_id: companyId } },
    });
    if (existing) throw AppErrors.conflict('E-mail já cadastrado nesta empresa');

    const hashed = await bcrypt.hash(data.password, 12);

    return prisma.user.create({
      data: {
        ...data,
        password: hashed,
        company_id: companyId,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, companyId: string, data: UpdateUserInput) {
    await this.findById(id, companyId);

    if (data.email) {
      const conflict = await prisma.user.findFirst({
        where: {
          email: data.email,
          company_id: companyId,
          NOT: { id },
        },
      });
      if (conflict) throw AppErrors.conflict('E-mail já em uso por outro usuário');
    }

    return prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async deactivate(id: string, companyId: string) {
    await this.findById(id, companyId);
    return prisma.user.update({
      where: { id },
      data: { active: false },
      select: USER_SELECT,
    });
  }

  async changePassword(
    id: string,
    companyId: string,
    data: ChangePasswordInput
  ) {
    const user = await prisma.user.findFirst({
      where: { id, company_id: companyId },
    });
    if (!user) throw AppErrors.notFound('Usuário não encontrado');

    const valid = await bcrypt.compare(data.current_password, user.password);
    if (!valid) throw AppErrors.unauthorized('Senha atual incorreta');

    const hashed = await bcrypt.hash(data.new_password, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
