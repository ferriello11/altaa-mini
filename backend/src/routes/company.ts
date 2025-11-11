import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authSession } from '../middlewares/authSession';
import { companyScope } from '../middlewares/companyScope';
import { requireRole } from '../middlewares/roleGuard';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/company/active
 * Retorna a empresa ativa (simples)
 */
router.get('/active',
  authSession,
  companyScope,
  async (req, res) => {
    const companyId = req.auth!.activeCompanyId!;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, logoUrl: true, createdAt: true },
    });
    if (!company) return res.status(404).json({ error: 'active company not found' });
    res.json({ company });
  }
);

/**
 * PUT /api/company/:id
 * Atualiza dados — ROLE >= ADMIN
 */
const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  logoUrl: z.string().url().nullable().optional(),
});

router.put('/:id',
  authSession,
  companyScope,
  requireRole('ADMIN','OWNER'),
  async (req, res) => {
    const { id } = req.params;
    if (id !== req.auth!.activeCompanyId) {
      return res.status(400).json({ error: 'id must match activeCompanyId' });
    }
    const parsed = updateCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.logoUrl !== undefined ? { logoUrl: parsed.data.logoUrl } : {}),
      },
      select: { id: true, name: true, logoUrl: true },
    });

    res.json({ company });
  }
);

/**
 * DELETE /api/company/:id
 * Apenas OWNER
 * (Regra de negócio: deletar empresa é ação extrema; aqui apagamos memberships e convites em transação)
 */
router.delete('/:id',
  authSession,
  companyScope,
  requireRole('OWNER'),
  async (req, res) => {
    const { id } = req.params;
    if (id !== req.auth!.activeCompanyId) {
      return res.status(400).json({ error: 'id must match activeCompanyId' });
    }

    await prisma.$transaction(async (tx) => {
      // Apaga convites e memberships antes para não violar FK
      await tx.invite.deleteMany({ where: { companyId: id } });
      await tx.membership.deleteMany({ where: { companyId: id } });
      await tx.company.delete({ where: { id } });

      // Se o usuário tinha activeCompanyId = id, limpe (não reemitimos cookie aqui)
      await tx.user.updateMany({
        where: { activeCompanyId: id },
        data: { activeCompanyId: null },
      });
    });

    res.status(204).send();
  }
);

/**
 * POST /api/company/:id/invite
 * Gerar convite — ADMIN/OWNER
 * Body: { email: string; role?: 'MEMBER' | 'ADMIN'; expiresInHours?: number }
 */
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['MEMBER','ADMIN']).optional().default('MEMBER'),
  expiresInHours: z.number().int().min(1).max(24 * 30).optional().default(72),
});

router.post('/:id/invite',
  authSession,
  companyScope,
  requireRole('ADMIN', 'OWNER'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (id !== req.auth!.activeCompanyId) {
        return res.status(400).json({ error: 'id must match activeCompanyId' });
      }

      const parsed = inviteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const { email, role } = parsed.data;

      // verificar se já existe membership na empresa
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        const already = await prisma.membership.findUnique({
          where: {
            userId_companyId: {
              userId: existingUser.id,
              companyId: id
            }
          }
        });
        if (already) {
          return res.status(400).json({ error: 'user already a member of this company' });
        }
      }

      // gerar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias

      const invite = await prisma.invite.create({
        data: {
          email: normalizedEmail,
          role,
          token,
          companyId: id,
          invitedById: req.auth!.user.id,
          expiresAt,
        }
      });

      // no desafio não há envio de e-mail, então retornamos o token
      return res.status(201).json({
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          token: invite.token,
          expiresAt: invite.expiresAt,
        }
      });

    } catch (err) {
      next(err);
    }
  }
);

export default router;
