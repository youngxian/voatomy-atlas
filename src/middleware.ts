import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://voatomy.com");

const PUBLIC_PREFIXES = ["/auth/session", "/api"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get("session")?.value?.trim());
}

function isDemoSession(request: NextRequest): boolean {
  if (request.nextUrl.searchParams.get("demo") === "true") return true;
  return request.cookies.get("atlas_demo")?.value === "1";
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (hasSession(request) || isDemoSession(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/auth/login", LANDING_URL);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
