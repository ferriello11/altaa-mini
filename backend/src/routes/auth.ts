import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { signSession, cookieName } from '../lib/jwt';
import { z } from 'zod';
import { authSession } from '../middlewares/authSession';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';

function setSessionCookie(res: any, userId: string, activeCompanyId: string | null) {
  const token = signSession({ sub: userId, activeCompanyId });
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
  });
}

function clearSessionCookie(res: any) {
  res.clearCookie(cookieName, { path: '/' });
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();


const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

const loginSchema = authSchema.pick({ email: true, password: true });

const acceptInviteSchema = z.object({
  token: z.string().min(10),
  setActive: z.boolean().optional().default(true),
});


/**
 * POST /auth/signup
 */
router.post('/signup', async (req, res, next) => {
  try {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const email = normalizeEmail(parsed.data.email);
    const { password, name } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'email already registered' });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name ?? null },
      select: { id: true, email: true, activeCompanyId: true },
    });

    setSessionCookie(res, user.id, user.activeCompanyId ?? null);
    return res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const email = normalizeEmail(parsed.data.email);
    const { password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, activeCompanyId: true },
    });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    setSessionCookie(res, user.id, user.activeCompanyId ?? null);
    return res.json({ user: { id: user.id, email: user.email, activeCompanyId: user.activeCompanyId } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 */
router.post('/logout', async (_req, res) => {
  clearSessionCookie(res);
  return res.status(204).send();
});

/**
 * GET /auth/me
 */
router.get('/me', authSession, async (req, res) => {
  const u = req.auth!.user;
  return res.json({
    user: { id: u.id, email: u.email, name: u.name, activeCompanyId: u.activeCompanyId ?? null },
  });
});

/**
 * POST /auth/accept-invite
 */
router.post('/accept-invite', authSession, async (req, res, next) => {
  try {
    const parsed = acceptInviteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { token, setActive } = parsed.data;
    const user = req.auth!.user;

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) return res.status(404).json({ error: 'invite not found' });
    if (invite.accepted) return res.status(400).json({ error: 'invite already accepted' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ error: 'invite expired' });

    if (normalizeEmail(invite.email) !== normalizeEmail(user.email)) {
      return res.status(403).json({ error: 'invite email does not match authenticated user' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.membership.findUnique({
        where: { userId_companyId: { userId: user.id, companyId: invite.companyId } },
      });

      if (!existing) {
        await tx.membership.create({
          data: {
            userId: user.id,
            companyId: invite.companyId,
            role: invite.role, 
          },
        });
      }

      await tx.invite.update({
        where: { token },
        data: { accepted: true },
      });

      let updatedActive: string | null = user.activeCompanyId ?? null;
      if (setActive) {
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { activeCompanyId: invite.companyId },
          select: { activeCompanyId: true, id: true },
        });
        updatedActive = updated.activeCompanyId ?? null;
      }

      return { activeCompanyId: updatedActive, companyId: invite.companyId };
    });

    setSessionCookie(res, user.id, result.activeCompanyId ?? null);

    return res.json({ ok: true, companyId: result.companyId, activeCompanyId: result.activeCompanyId ?? null });
  } catch (err) {
    next(err);
  }
});

export default router;
