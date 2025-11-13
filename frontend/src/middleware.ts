import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const publicRoutes = ["/login", "/signup"];
  const { pathname } = req.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const session = req.cookies.get("sid")?.value;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
