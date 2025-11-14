import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CompanyInviteService } from "../services/CompanyInviteService";

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(["MEMBER", "ADMIN"]).default("MEMBER"),
    expiresInHours: z.number().int().min(1).max(24 * 30).default(72),
});

export class CompanyInviteController {
    private service: CompanyInviteService;

    constructor() {
        this.service = new CompanyInviteService();
    }

    createInvite = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = inviteSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ error: parsed.error.flatten() });
            }

            const companyId = req.params.id;

            if (companyId !== req.auth!.activeCompanyId) {
                return res.status(400).json({ error: "id must match activeCompanyId" });
            }

            const result = await this.service.createInvite(
                companyId,
                req.auth!.user.id,
                parsed.data
            );

            if ("error" in result) {
                return res.status(result.status ?? 400).json({ error: result.error });
            }

            return res.status(result.reused ? 200 : 201).json({
                invite: result.invite,
                reused: result.reused,
            });
        } catch (err) {
            next(err);
        }
    };
}
