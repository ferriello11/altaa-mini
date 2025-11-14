import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

export class CompanyInviteRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findMembership(userId: string, companyId: string) {
    return prisma.membership.findUnique({
      where: {
        userId_companyId: { userId, companyId },
      },
    });
  }

  async findActiveInvite(email: string, companyId: string) {
    return prisma.invite.findFirst({
      where: {
        email,
        companyId,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async createInvite(data: {
    email: string;
    role: Role;
    token: string;
    companyId: string;
    invitedById: string;
    expiresAt: Date;
  }) {
    return prisma.invite.create({ data });
  }
}
