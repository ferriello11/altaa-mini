import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authSession } from '../middlewares/authSession';
import { companyScope } from '../middlewares/companyScope';
import { requireRole } from '../middlewares/roleGuard';

const router = Router();

/**
 * GET /api/company/:id/members
 */
router.get('/:id/members',
  authSession,
  companyScope,
  requireRole('ADMIN','OWNER','MEMBER'),
  async (req, res) => {
    const { id } = req.params;
    if (id !== req.auth!.activeCompanyId) {
      return res.status(400).json({ error: 'id must match activeCompanyId' });
    }

    const members = await prisma.membership.findMany({
      where: { companyId: id },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      items: members.map(m => ({
        id: m.id,
        role: m.role,
        user: m.user,
      }))
    });
  }
);

/**
 * PUT /api/company/:id/members/:memberId
 * Alterar papel — ADMIN/OWNER
 * Regras:
 * - ADMIN não pode alterar/remover OWNER
 * - Empresa nunca pode ficar sem OWNER
 */
const updateRoleSchema = z.object({
  role: z.enum(['MEMBER','ADMIN','OWNER']),
});

router.put('/:id/members/:memberId',
  authSession,
  companyScope,
  requireRole('ADMIN','OWNER'),
  async (req, res) => {
    const { id, memberId } = req.params;
    if (id !== req.auth!.activeCompanyId) {
      return res.status(400).json({ error: 'id must match activeCompanyId' });
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    // Quer mudar para qual papel?
    const toRole = parsed.data.role;

    const actingRole = req.auth!.membership!.role; // role de quem está fazendo a ação

    // Quem está sendo alterado?
    const target = await prisma.membership.findUnique({ where: { id: memberId } });
    if (!target || target.companyId !== id) {
      return res.status(404).json({ error: 'member not found in this company' });
    }

    // ADMIN não pode tocar em OWNER
    if (actingRole === 'ADMIN' && target.role === 'OWNER') {
      return res.status(403).json({ error: 'ADMIN cannot change OWNER' });
    }

    // Se estamos rebaixando um OWNER, precisa garantir que não é o ÚNICO OWNER
    if (target.role === 'OWNER' && toRole !== 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { companyId: id, role: 'OWNER' }
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: 'company must have at least one OWNER' });
      }
    }

    const updated = await prisma.membership.update({
      where: { id: memberId },
      data: { role: toRole },
      select: { id: true, role: true },
    });

    res.json({ member: updated });
  }
);

/**
 * DELETE /api/company/:id/members/:memberId
 * Remover membro — ADMIN/OWNER
 * Regras:
 * - ADMIN não remove OWNER
 * - Empresa nunca pode ficar sem OWNER
 */
router.delete('/:id/members/:memberId',
  authSession,
  companyScope,
  requireRole('ADMIN','OWNER'),
  async (req, res) => {
    const { id, memberId } = req.params;
    if (id !== req.auth!.activeCompanyId) {
      return res.status(400).json({ error: 'id must match activeCompanyId' });
    }

    const actingRole = req.auth!.membership!.role;

    const target = await prisma.membership.findUnique({ where: { id: memberId } });
    if (!target || target.companyId !== id) {
      return res.status(404).json({ error: 'member not found in this company' });
    }

    // ADMIN não pode remover OWNER
    if (actingRole === 'ADMIN' && target.role === 'OWNER') {
      return res.status(403).json({ error: 'ADMIN cannot remove OWNER' });
    }

    // Impedir que a empresa fique sem OWNER
    if (target.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { companyId: id, role: 'OWNER' }
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: 'company must have at least one OWNER' });
      }
    }

    await prisma.membership.delete({ where: { id: memberId } });
    res.status(204).send();
  }
);

export default router;
