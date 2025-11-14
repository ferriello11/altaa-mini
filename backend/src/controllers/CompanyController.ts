import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { CompanyService } from "../services/CompanyService";

const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  logoUrl: z.string().nullable().optional(),
});

export class CompanyController {
  private service: CompanyService;

  constructor() {
    this.service = new CompanyService();
  }

  getActive = async (req: Request, res: Response) => {
    const companyId = req.auth!.activeCompanyId!;
    const company = await this.service.getActiveCompany(companyId);

    if (!company) return res.status(404).json({ error: "active company not found" });

    return res.json({ company });
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.params.id;

      if (companyId !== req.auth!.activeCompanyId) {
        return res.status(400).json({ error: "id must match activeCompanyId" });
      }

      const parsed = updateCompanySchema.safeParse({
        name: req.body.name,
        logoUrl: req.body.logoUrl,
      });

      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const updated = await this.service.updateCompany(companyId, {
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl ?? null,
        file: req.file,
      });

      return res.json({ company: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response) => {
    const companyId = req.params.id;

    if (companyId !== req.auth!.activeCompanyId) {
      return res.status(400).json({ error: "id must match activeCompanyId" });
    }

    await this.service.deleteCompany(companyId);

    return res.status(204).send();
  };
}
