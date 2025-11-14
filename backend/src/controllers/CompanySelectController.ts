import { Request, Response } from "express";
import { signSession, cookieName } from "../lib/jwt";
import { CompanySelectService } from "../services/CompanySelectService";

export class CompanySelectController {
    private service: CompanySelectService;

    constructor() {
        this.service = new CompanySelectService();
    }

    select = async (req: Request, res: Response) => {
        const user = req.auth!.user;
        const companyId = req.params.id;

        const result = await this.service.selectCompany(user, companyId);

        if ("error" in result) {
            return res.status(result.status ?? 400).json({ error: result.error });
        }

        const updated = result.updatedUser;

        const token = signSession({
            sub: updated.id,
            activeCompanyId: updated.activeCompanyId ?? null,
        });

        res.cookie(cookieName, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
        });

        return res.json({
            ok: true,
            activeCompanyId: updated.activeCompanyId,
        });
    };
}
