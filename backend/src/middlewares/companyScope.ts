import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Exige que o usuário tenha activeCompanyId e seja membro dessa empresa.
 * (Apenas usuários membros da empresa podem acessá-la) :contentReference[oaicite:3]{index=3}
 */
export async function companyScope(req: Request, res: Response, next: NextFunction) {
  const activeCompanyId = req.auth?.activeCompanyId;
  const userId = req.auth?.user.id;
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  if (!activeCompanyId) return res.status(400).json({ error: 'no active company selected' });

  const membership = await prisma.membership.findUnique({
    where: { userId_companyId: { userId, companyId: activeCompanyId } }
  });

  if (!membership) return res.status(403).json({ error: 'forbidden: not a member of active company' });

  req.auth!.membership = membership;
  next();
}
