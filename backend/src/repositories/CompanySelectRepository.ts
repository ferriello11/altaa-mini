import { prisma } from "../lib/prisma";

export class CompanySelectRepository {
  async findMembership(userId: string, companyId: string) {
    return prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } }
    });
  }

  async updateActiveCompany(userId: string, companyId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { activeCompanyId: companyId },
    });
  }
}
