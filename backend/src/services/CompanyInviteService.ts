import crypto from "crypto";
import { CompanyInviteRepository } from "../repositories/CompanyInviteRepository";

export class CompanyInviteService {
  private repo: CompanyInviteRepository;

  constructor() {
    this.repo = new CompanyInviteRepository();
  }

  async createInvite(companyId: string, invitedById: string, body: any) {
    const email = body.email.trim().toLowerCase();
    const role = body.role ?? "MEMBER";
    const expiresInHours = body.expiresInHours ?? 72;

    const existingUser = await this.repo.findUserByEmail(email);

    if (existingUser) {
      const alreadyMember = await this.repo.findMembership(existingUser.id, companyId);
      if (alreadyMember) {
        return {
          error: "user already a member of this company",
          status: 400,
        };
      }
    }

    const activeInvite = await this.repo.findActiveInvite(email, companyId);
    if (activeInvite) {
      return {
        reused: true,
        invite: activeInvite,
      };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invite = await this.repo.createInvite({
      email,
      role,
      token,
      companyId,
      invitedById,
      expiresAt,
    });

    return {
      reused: false,
      invite,
    };
  }
}
