import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { cookieName, signSession } from "../lib/jwt";
import { CompanyService } from "../services/CompaniesService";

const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(120),
  setActive: z.boolean().optional().default(true),
});

export class CompanyController {
  private service: CompanyService;

  constructor() {
    this.service = new CompanyService();
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createCompanySchema.safeParse({
        name: req.body.name,
        setActive: req.body.setActive === "true",
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const result = await this.service.createCompany({
        name: parsed.data.name,
        setActive: parsed.data.setActive,
        file: req.file,
        user: req.auth!.user,
      });

      if ("error" in result) {
        return res.status(result.status).json(result);
      }

      const jwt = signSession({
        sub: result.updatedUser.id,
        activeCompanyId: result.updatedUser.activeCompanyId ?? null,
      });

      res.cookie(cookieName, jwt, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      return res.status(201).json({
        company: {
          id: result.company.id,
          name: result.company.name,
          logoUrl: result.company.logoUrl,
        },
        membership: { role: result.membership.role },
        activeCompanyId: result.updatedUser.activeCompanyId ?? null,
      });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response) => {
    const userId = req.auth!.user.id;

    const result = await this.service.listCompanies(req.query, userId);

    return res.json(result);
  };
}
