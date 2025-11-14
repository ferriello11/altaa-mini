import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { signSession, cookieName } from "../lib/jwt";
import { AuthService } from "../services/AuthService";

const isProd = process.env.NODE_ENV === "production";

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  private setSessionCookie(res: Response, userId: string, activeCompanyId: string | null) {
    const token = signSession({ sub: userId, activeCompanyId });

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
    });
  }

  private clearSessionCookie(res: Response) {
    res.clearCookie(cookieName, { path: "/" });
  }

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const { email, password, name } = parsed.data;
      const user = await this.service.signup(email, password, name ?? null);

      this.setSessionCookie(res, user.id, user.activeCompanyId ?? null);
      return res.status(201).json({ user });
    } catch (err: any) {
      return next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const { email, password } = parsed.data;
      const user = await this.service.login(email, password);

      this.setSessionCookie(res, user.id, user.activeCompanyId ?? null);
      return res.json({ user });
    } catch (err) {
      next(err);
    }
  };

  logout = async (_req: Request, res: Response) => {
    this.clearSessionCookie(res);
    return res.status(204).send();
  };

  me = async (req: Request, res: Response) => {
    const u = req.auth!.user;
    return res.json({
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        activeCompanyId: u.activeCompanyId ?? null,
      },
    });
  };

  invites = async (req: Request, res: Response) => {
    const user = req.auth!.user;
    const items = await this.service.getInvites(user.email);
    return res.json({ items });
  };

  acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        token: z.string().min(10),
        setActive: z.boolean().optional().default(true),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      const { token, setActive } = parsed.data;
      const user = req.auth!.user;

      const result = await this.service.acceptInvite(token, user, setActive);

      this.setSessionCookie(res, user.id, result.activeCompanyId ?? null);

      return res.json({
        ok: true,
        companyId: result.companyId,
        activeCompanyId: result.activeCompanyId ?? null,
      });
    } catch (err) {
      next(err);
    }
  };

  session = async (req: Request, res: Response) => {
    const user = req.auth!.user;
    const activeRole = await this.service.getActiveSession(user);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        activeCompanyId: user.activeCompanyId ?? null,
        activeCompanyRole: activeRole,
      },
    });
  };
}
