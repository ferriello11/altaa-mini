import { MembersRepository } from "../repositories/MembersRepository";
import { Role } from "@prisma/client";

export class MembersService {
  private repo: MembersRepository;

  constructor() {
    this.repo = new MembersRepository();
  }

  async listMembers(companyId: string) {
    const company = await this.repo.findCompany(companyId);

    if (!company) {
      return { error: "Company not found", status: 404 };
    }

    const members = await this.repo.findMembers(companyId);

    return {
      company,
      members,
    };
  }

  async updateMemberRole(companyId: string, memberId: string, actingRole: string, newRole: string) {
    const target = await this.repo.findMembershipById(memberId);

    if (!target || target.companyId !== companyId) {
      return { error: "member not found in this company", status: 404 };
    }

    if (actingRole === "ADMIN" && target.role === "OWNER") {
      return { error: "ADMIN cannot change OWNER", status: 403 };
    }

    if (target.role === "OWNER" && newRole !== "OWNER") {
      const ownerCount = await this.repo.countOwners(companyId);
      if (ownerCount <= 1) {
        return { error: "company must have at least one OWNER", status: 400 };
      }
    }

    const updated = await this.repo.updateRole(memberId, newRole as Role);

    return { member: updated };
  }

  async removeMember(companyId: string, memberId: string, actingRole: string) {
    const target = await this.repo.findMembershipById(memberId);

    if (!target || target.companyId !== companyId) {
      return { error: "member not found in this company", status: 404 };
    }

    if (actingRole === "ADMIN" && target.role === "OWNER") {
      return { error: "ADMIN cannot remove OWNER", status: 403 };
    }

    const ownerCount = await this.repo.countOwners(companyId);
    if (target.role === "OWNER" && ownerCount <= 1) {
      return { error: "company must have at least one OWNER", status: 400 };
    }

    await this.repo.deleteMembership(memberId);

    return { ok: true };
  }
}
