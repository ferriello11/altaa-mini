import jwt from "jsonwebtoken";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not loaded (process.env.JWT_SECRET is undefined)");
  }
  return secret;
}

const COOKIE = process.env.SESSION_COOKIE_NAME || "sid";

export type SessionJwt = {
  sub: string;
  activeCompanyId: string | null;
  iat?: number;
  exp?: number;
};

export function signSession(
  payload: Omit<SessionJwt, "iat" | "exp">,
  ttlSec = 60 * 60 * 24 * 7
) {
  return jwt.sign(payload, getSecret(), { expiresIn: ttlSec });
}

export function verifySession(token: string): SessionJwt {
  return jwt.verify(token, getSecret()) as SessionJwt;
}

export const cookieName = COOKIE;
