import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../config/jwt';
import { AppErrors } from '../../middlewares/error.middleware';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schemas';

export class AuthService {
  /**
   * Register a new company and an admin user.
   * Returns tokens immediately after registration.
   */
  async register(input: RegisterInput) {
    const {
      company_name,
      company_cnpj,
      company_email,
      company_phone,
      company_address,
      name,
      email,
      password,
    } = input;

    // Check company CNPJ uniqueness
    const existingCompany = await prisma.company.findUnique({
      where: { cnpj: company_cnpj },
    });
    if (existingCompany) {
      throw AppErrors.conflict('CNPJ já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company + admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: company_name,
          cnpj: company_cnpj,
          email: company_email,
          phone: company_phone,
          address: company_address,
        },
      });

      const user = await tx.user.create({
        data: {
          company_id: company.id,
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      return { company, user };
    });

    const { user, company } = result;

    const accessToken = signAccessToken({
      userId: user.id,
      companyId: company.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      companyId: company.id,
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
      company,
    };
  }

  /**
   * Login with email + password.
   * Returns access + refresh tokens.
   */
  async login(input: LoginInput) {
    const { email, password } = input;

    // Find any user across all companies with this email
    // We query all matches and validate password — this supports
    // the same email being registered in multiple companies.
    const users = await prisma.user.findMany({
      where: { email, active: true },
      include: { company: { select: { id: true, name: true, active: true } } },
    });

    if (users.length === 0) {
      throw AppErrors.unauthorized('Credenciais inválidas');
    }

    // Find the user with matching password
    let matchedUser = null;
    for (const u of users) {
      const valid = await bcrypt.compare(password, u.password);
      if (valid && u.company.active) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      throw AppErrors.unauthorized('Credenciais inválidas ou empresa inativa');
    }

    const accessToken = signAccessToken({
      userId: matchedUser.id,
      companyId: matchedUser.company_id,
      role: matchedUser.role,
      email: matchedUser.email,
    });

    const refreshToken = signRefreshToken({
      userId: matchedUser.id,
      companyId: matchedUser.company_id,
    });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(matchedUser),
      company: matchedUser.company,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refresh(input: RefreshInput) {
    let payload;
    try {
      payload = verifyRefreshToken(input.refresh_token);
    } catch {
      throw AppErrors.unauthorized('Refresh token inválido ou expirado');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { company: { select: { id: true, active: true } } },
    });

    if (!user || !user.active || !user.company.active) {
      throw AppErrors.unauthorized('Usuário ou empresa inativo');
    }

    const accessToken = signAccessToken({
      userId: user.id,
      companyId: user.company_id,
      role: user.role,
      email: user.email,
    });

    return { accessToken };
  }

  /**
   * Get the currently authenticated user's data.
   */
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: { id: true, name: true, cnpj: true, logo_url: true },
        },
      },
    });

    if (!user || !user.active) {
      throw AppErrors.unauthorized('Usuário não encontrado');
    }

    return this.sanitizeUser(user);
  }

  /** Remove password hash from user object */
  private sanitizeUser(user: { password?: string; [key: string]: unknown }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safe } = user;
    return safe;
  }
}
