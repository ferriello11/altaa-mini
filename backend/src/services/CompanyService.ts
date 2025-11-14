import { CompanyRepository } from "../repositories/CompanyRepository";
import { prisma } from "../lib/prisma";
import { uploadToS3 } from "../lib/s3";

export class CompanyService {
  private repo: CompanyRepository;

  constructor() {
    this.repo = new CompanyRepository();
  }

  async getActiveCompany(companyId: string) {
    return this.repo.getActiveCompany(companyId);
  }

  async updateCompany(companyId: string, payload: {
    name?: string;
    file?: Express.Multer.File | undefined;
    logoUrl?: string | null;
  }) {
    let logoUrl = payload.logoUrl;

    if (payload.file) {
      logoUrl = await uploadToS3(payload.file);
    }

    return this.repo.updateCompany(companyId, {
      name: payload.name,
      logoUrl,
    });
  }

  async deleteCompany(companyId: string) {
    return prisma.$transaction(async (tx) => {
      await this.repo.deleteCompany(companyId, tx);
    });
  }
}
