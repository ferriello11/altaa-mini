import { NextRequest, NextResponse } from "next/server";

function decodeJwt(token: string): any | null {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/login", "/signup"];

  const session = req.cookies.get("sid")?.value;
  const isPublic = publicRoutes.includes(pathname);

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/company/")) {
    const parts = pathname.split("/");
    const companyIdFromUrl = parts[2];

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const jwtPayload = decodeJwt(session);

    if (!jwtPayload) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const activeCompanyId = jwtPayload.activeCompanyId;

    if (!activeCompanyId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (activeCompanyId !== companyIdFromUrl) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
