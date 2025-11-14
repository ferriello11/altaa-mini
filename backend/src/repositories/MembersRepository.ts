import { prisma } from "../lib/prisma";
import { Role } from "@prisma/client";

export class MembersRepository {
  async findCompany(companyId: string) {
    return prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, logoUrl: true },
    });
  }

  async findMembers(companyId: string) {
    return prisma.membership.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, email: true, name: true } }
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findMembershipById(memberId: string) {
    return prisma.membership.findUnique({
      where: { id: memberId },
    });
  }

  async countOwners(companyId: string) {
    return prisma.membership.count({
      where: { companyId, role: "OWNER" },
    });
  }

  async updateRole(memberId: string, role: Role) {
    return prisma.membership.update({
      where: { id: memberId },
      data: { role },
      select: { id: true, role: true },
    });
  }

  async deleteMembership(memberId: string) {
    return prisma.membership.delete({ where: { id: memberId } });
  }
}
