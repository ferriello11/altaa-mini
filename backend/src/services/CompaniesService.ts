import { prisma } from "../lib/prisma";
import { CompanyRepository } from "../repositories/CompaniesRepository";
import { uploadToS3 } from "../lib/s3";
import { parsePagination } from "../lib/pagination";

export class CompanyService {
  private repo: CompanyRepository;

  constructor() {
    this.repo = new CompanyRepository();
  }

  async createCompany(
    payload: { name: string; setActive: boolean; file?: Express.Multer.File; user: any }
  ) {
    const { name, setActive, file, user } = payload;

    const exists = await this.repo.findCompanyOwner(user.id);
    if (exists) {
      return {
        error: "user_already_owns_company",
        message: "Você já possui uma empresa e não pode criar outra.",
        companyId: exists.companyId,
        status: 400,
      };
    }

    let logoUrl: string | null = null;
    if (file) {
      logoUrl = await uploadToS3(file);
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await this.repo.createCompany(name.trim(), logoUrl, tx);

      const membership = await this.repo.createMembership(user.id, company.id, tx);

      let updatedUser = user;
      if (setActive) {
        updatedUser = await this.repo.updateActiveCompany(user.id, company.id, tx);
      }

      return { company, membership, updatedUser };
    });

    return result;
  }

  async listCompanies(query: any, userId: string) {
    const { skip, take, page, pageSize } = parsePagination(query);

    const { items, total } = await this.repo.listUserCompanies(userId, skip, take);

    return {
      page,
      pageSize,
      total,
      items: items.map((m) => ({
        company: {
          id: m.company.id,
          name: m.company.name,
          logoUrl: m.company.logoUrl,
        },
        role: m.role,
      })),
    };
  }
}
