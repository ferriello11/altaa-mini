import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authSession } from '../middlewares/authSession';
import { signSession, cookieName } from '../lib/jwt';

const router = Router();

router.post('/:id/select', authSession, async (req, res) => {
  const companyId = req.params.id;
  const user = req.auth!.user;

  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId: user.id, companyId } }
  });
  if (!membership) return res.status(403).json({ error: 'forbidden: not a member of company' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { activeCompanyId: companyId },
  });

  const token = signSession({ sub: updated.id, activeCompanyId: updated.activeCompanyId ?? null });
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return res.json({ ok: true, activeCompanyId: updated.activeCompanyId });
});

export default router;
