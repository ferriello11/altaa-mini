import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authSession } from '../middlewares/authSession';
import { parsePagination } from '../lib/pagination';
import { z } from 'zod';
import { cookieName, signSession } from '../lib/jwt';

const router = Router();

/* ---------- POST /api/companies -----------
 * Body: { name: string, logoUrl?: string, setActive?: boolean }
 * Cria Company + Membership(OWNER) e (opcional) seta como ativa.
 */
const createCompanySchema = z.object({
   name: z.string().trim().min(2).max(120),
   logoUrl: z.string().url().optional(),
   setActive: z.boolean().optional().default(true),
 });

 // POST /creat companies — lista empresas que o usuário participa
 router.post('/', authSession, async (req, res, next) => {
  try {
    const parsed = createCompanySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { name, logoUrl, setActive } = parsed.data;
    const user = req.auth!.user;

    // 🔒 Pré-checagem: o usuário já é OWNER em outra empresa?
    const alreadyOwner = await prisma.membership.findFirst({
      where: { userId: user.id, role: 'OWNER' },
      select: { id: true, companyId: true },
    });
    if (alreadyOwner) {
      return res.status(400).json({
        error: 'user_already_owns_company',
        details: { companyId: alreadyOwner.companyId, membershipId: alreadyOwner.id },
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: name.trim(), logoUrl: logoUrl ?? null },
      });

      const membership = await tx.membership.create({
        data: { userId: user.id, companyId: company.id, role: 'OWNER' },
      });

      let updatedUser = user;
      if (setActive) {
        updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { activeCompanyId: company.id },
        });
      }

      return { company, membership, updatedUser };
    });

    // Reemite cookie com activeCompanyId (se setActive=true)
    const jwt = signSession({
      sub: result.updatedUser.id,
      activeCompanyId: result.updatedUser.activeCompanyId ?? null,
    });
    res.cookie(cookieName, jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
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
// GET /companies — lista empresas que o usuário participa
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
