import { AuthRepository } from "../repositories/AuthRepository";
import { hashPassword, verifyPassword } from "../lib/crypto";
import { prisma } from "../lib/prisma";

export class AuthService {
  private repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async signup(email: string, password: string, name: string | null) {
    const normalized = this.normalizeEmail(email);

    const exists = await this.repo.findUserByEmail(normalized);
    if (exists) throw { status: 409, message: "email already registered" };

    const passwordHash = await hashPassword(password);

    return this.repo.createUser({
      email: normalized,
      passwordHash,
      name,
    });
  }

  async login(email: string, password: string) {
    const normalized = this.normalizeEmail(email);

    const user = await this.repo.findUserByEmail(normalized);
    if (!user) throw { status: 401, message: "invalid credentials" };

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) throw { status: 401, message: "invalid credentials" };

    return user;
  }

  async getInvites(email: string) {
    return this.repo.findInvitesByEmail(this.normalizeEmail(email));
  }

  async acceptInvite(token: string, user: any, setActive: boolean) {
    const invite = await this.repo.findInviteByToken(token);
    if (!invite) throw { status: 404, message: "invite not found" };
    if (invite.accepted) throw { status: 400, message: "invite already accepted" };
    if (invite.expiresAt < new Date()) throw { status: 400, message: "invite expired" };

    if (this.normalizeEmail(invite.email) !== this.normalizeEmail(user.email)) {
      throw { status: 403, message: "invite email does not match authenticated user" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.membership.findUnique({
        where: { userId_companyId: { userId: user.id, companyId: invite.companyId } },
      });

      if (!existing) {
        await tx.membership.create({
          data: {
            userId: user.id,
            companyId: invite.companyId,
            role: invite.role,
          },
        });
      }

      await tx.invite.update({
        where: { token },
        data: { accepted: true },
      });

      let updatedActive = user.activeCompanyId ?? null;

      if (setActive) {
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { activeCompanyId: invite.companyId },
          select: { activeCompanyId: true, id: true },
        });
        updatedActive = updated.activeCompanyId ?? null;
      }

      return { activeCompanyId: updatedActive, companyId: invite.companyId };
    });

    return result;
  }

  async getActiveSession(user: any) {
    if (!user.activeCompanyId) return null;

    const membership = await this.repo.getActiveRole(user.id, user.activeCompanyId);
    return membership?.role ?? null;
  }
}
