import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export class CompanyRepository {
  async findCompanyOwner(userId: string) {
    return prisma.membership.findFirst({
      where: { userId, role: "OWNER" },
      select: { companyId: true },
    });
  }

  async createCompany(name: string, logoUrl: string | null, tx: Prisma.TransactionClient) {
    return tx.company.create({
      data: { name, logoUrl },
    });
  }

  async createMembership(userId: string, companyId: string, tx: Prisma.TransactionClient) {
    return tx.membership.create({
      data: { userId, companyId, role: "OWNER" },
    });
  }

  async updateActiveCompany(userId: string, companyId: string, tx: Prisma.TransactionClient) {
    return tx.user.update({
      where: { id: userId },
      data: { activeCompanyId: companyId },
    });
  }

  async listUserCompanies(userId: string, skip: number, take: number) {
    const items = await prisma.membership.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    const total = await prisma.membership.count({ where: { userId } });

    return { items, total };
  }
}
