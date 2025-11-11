import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
const COOKIE = process.env.SESSION_COOKIE_NAME || 'sid';

export type SessionJwt = {
  sub: string;              
  activeCompanyId: string | null;
  iat?: number;
  exp?: number;
};

export function signSession(payload: Omit<SessionJwt, 'iat'|'exp'>, ttlSec = 60 * 60 * 24 * 7) {
  return jwt.sign(payload, SECRET, { expiresIn: ttlSec });
}

export function verifySession(token: string): SessionJwt {
  return jwt.verify(token, SECRET) as SessionJwt;
}

export const cookieName = COOKIE;
