import { Request, Response } from "express";
import { z } from "zod";
import { MembersService } from "../services/MembersService";

const updateRoleSchema = z.object({
    role: z.enum(["MEMBER", "ADMIN", "OWNER"]),
});

export class MembersController {
    private service: MembersService;

    constructor() {
        this.service = new MembersService();
    }

    list = async (req: Request, res: Response) => {
        const companyId = req.params.id;

        if (companyId !== req.auth!.activeCompanyId) {
            return res.status(400).json({ error: "id must match activeCompanyId" });
        }

        const result = await this.service.listMembers(companyId);

        if ("error" in result) {
            return res.status(result.status ?? 400).json({ error: result.error });
        }

        return res.json({
            company: {
                id: result.company.id,
                name: result.company.name,
                logoUlr: result.company.logoUrl,
            },
            items: result.members.map((m) => ({
                id: m.id,
                role: m.role,
                user: m.user,
            })),
        });
    };

    updateRole = async (req: Request, res: Response) => {
        const companyId = req.params.id;
        const memberId = req.params.memberId;

        if (companyId !== req.auth!.activeCompanyId) {
            return res.status(400).json({ error: "id must match activeCompanyId" });
        }

        const parsed = updateRoleSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const result = await this.service.updateMemberRole(
            companyId,
            memberId,
            req.auth!.membership!.role,
            parsed.data.role
        );

        if ("error" in result) {
            return res.status(result.status ?? 400).json({ error: result.error });
        }

        return res.json(result);
    };

    remove = async (req: Request, res: Response) => {
        const companyId = req.params.id;
        const memberId = req.params.memberId;

        if (companyId !== req.auth!.activeCompanyId) {
            return res.status(400).json({ error: "id must match activeCompanyId" });
        }

        const result = await this.service.removeMember(
            companyId,
            memberId,
            req.auth!.membership!.role
        );

        if ("error" in result) {
            return res.status(result.status ?? 400).json({ error: result.error });
        }

        return res.status(204).send();
    };
}
