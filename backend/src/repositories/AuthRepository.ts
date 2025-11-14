import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, activeCompanyId: true, name: true }
    });
  }

  async createUser(data: { email: string; passwordHash: string; name: string | null }) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, activeCompanyId: true }
    });
  }

  async findInvitesByEmail(email: string) {
    return prisma.invite.findMany({
      where: { email, accepted: false },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        company: { select: { id: true, name: true } }
      },
    });
  }

  async findInviteByToken(token: string) {
    return prisma.invite.findUnique({ where: { token } });
  }

  async updateInviteAsAccepted(token: string) {
    return prisma.invite.update({
      where: { token },
      data: { accepted: true }
    });
  }

  async findMembership(userId: string, companyId: string) {
    return prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } }
    });
  }

  async createMembership(data: { userId: string; companyId: string; role: Role }) {
    return prisma.membership.create({ data });
  }

  async updateUserActiveCompany(userId: string, companyId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { activeCompanyId: companyId },
      select: { activeCompanyId: true, id: true },
    });
  }

  async getActiveRole(userId: string, companyId: string) {
    return prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } }
    });
  }
}
