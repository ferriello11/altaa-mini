import { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.membership?.role;
    if (!role) return res.status(403).json({ error: 'forbidden: no role in active company' });
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: `forbidden: requires ${allowed.join(' or ')}` });
    }
    next();
  };
}
