import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authSession } from '../middlewares/authSession';
import { parsePagination } from '../lib/pagination';
import { z } from 'zod';
import { cookieName, signSession } from '../lib/jwt';
import multer from "multer";
import { uploadToS3 } from "../lib/s3";

const router = Router();
const upload = multer();
/*
 ---------- POST /api/companies -----------
 */

const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(120),
  logoUrl: z.string().url().nullable().optional(),
  setActive: z.boolean().optional().default(true),
});

router.post("/", authSession, upload.single("logo"), async (req, res, next) => {
  try {
    const { name, setActive } = req.body;
    const user = req.auth!.user;

    const alreadyOwner = await prisma.membership.findFirst({
      where: { userId: user.id, role: "OWNER" },
      select: { companyId: true },
    });

    if (alreadyOwner) {
      return res.status(400).json({
        error: "user_already_owns_company",
        message: "Você já possui uma empresa e não pode criar outra.",
        companyId: alreadyOwner.companyId,
      });
    }

    let logoUrl: string | null = null;
    if (req.file) {
      logoUrl = await uploadToS3(req.file);
    }

    const parsed = createCompanySchema.safeParse({
      name,
      logoUrl,
      setActive: setActive === "true",
    });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: parsed.data.name.trim(),
          logoUrl: parsed.data.logoUrl,
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "OWNER",
        },
      });

      let updatedUser = user;
      if (parsed.data.setActive) {
        updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { activeCompanyId: company.id },
        });
      }

      return { company, membership, updatedUser };
    });

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
});


/*
 ---------- GET /api/companies -----------
 */
router.get('/', authSession, async (req, res) => {
  const userId = req.auth!.user.id;
  const { skip, take, page, pageSize } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    prisma.membership.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
      skip, take,
    }),
    prisma.membership.count({ where: { userId } })
  ]);

  res.json({
    page, pageSize, total,
    items: items.map(m => ({
      company: { id: m.company.id, name: m.company.name, logoUrl: m.company.logoUrl },
      role: m.role
    }))
  });
});

export default router;
