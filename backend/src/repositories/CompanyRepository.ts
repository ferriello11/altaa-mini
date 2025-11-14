import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class CompanyRepository {
  async getActiveCompany(companyId: string) {
    return prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, logoUrl: true, createdAt: true },
    });
  }

  async updateCompany(
    companyId: string,
    data: { name?: string; logoUrl?: string | null }
  ) {
    return prisma.company.update({
      where: { id: companyId },
      data,
      select: { id: true, name: true, logoUrl: true },
    });
  }

  async deleteCompany(companyId: string, tx: Prisma.TransactionClient) {
    await tx.invite.deleteMany({ where: { companyId } });
    await tx.membership.deleteMany({ where: { companyId } });
    await tx.company.delete({ where: { id: companyId } });

    await tx.user.updateMany({
      where: { activeCompanyId: companyId },
      data: { activeCompanyId: null },
    });
  }
}
