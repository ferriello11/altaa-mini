import { NextFunction, Request, Response } from 'express';
import { cookieName, verifySession } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export async function authSession(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[cookieName];
  if (!token) return res.status(401).json({ error: 'unauthenticated' });

  try {
    const payload = verifySession(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'invalid user' });

    req.auth = {
      user,
      activeCompanyId: payload.activeCompanyId ?? user.activeCompanyId ?? null,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}
