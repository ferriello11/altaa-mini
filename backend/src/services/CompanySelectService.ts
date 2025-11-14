import { CompanySelectRepository } from "../repositories/CompanySelectRepository";

export class CompanySelectService {
  private repo: CompanySelectRepository;

  constructor() {
    this.repo = new CompanySelectRepository();
  }

  async selectCompany(user: any, companyId: string) {
    const membership = await this.repo.findMembership(user.id, companyId);

    if (!membership) {
      return {
        error: "forbidden: not a member of company",
        status: 403,
      };
    }

    const updated = await this.repo.updateActiveCompany(user.id, companyId);

    return {
      updatedUser: updated,
    };
  }
}
