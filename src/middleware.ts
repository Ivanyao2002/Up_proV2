import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS: Record<string, string[]> = {
  admin: ["/admin/login"],
  compta: ["/compta/login"],
  support: ["/support/login"],
  reporting: ["/reporting/login"],
  partner: ["/partner/login"],
  franchise: ["/franchise/login"],
  dispatch: ["/dispatch/login"],
};

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function withBasePath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

function guardPortal(
  request: NextRequest,
  prefix:
    | "/admin"
    | "/compta"
    | "/support"
    | "/reporting"
    | "/partner"
    | "/franchise"
    | "/dispatch",
  loginPath: string
) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const publicPaths = PUBLIC_PATHS[prefix.slice(1)] ?? [];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  const hasAuth = request.cookies.get("upjunoo_auth")?.value === "1";
  if (!hasAuth) {
    const login = new URL(withBasePath(loginPath), request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export function middleware(request: NextRequest) {
  return (
    guardPortal(request, "/admin", "/admin/login") ??
    guardPortal(request, "/compta", "/compta/login") ??
    guardPortal(request, "/support", "/support/login") ??
    guardPortal(request, "/reporting", "/reporting/login") ??
    guardPortal(request, "/partner", "/partner/login") ??
    guardPortal(request, "/franchise", "/franchise/login") ??
    guardPortal(request, "/dispatch", "/dispatch/login") ??
    NextResponse.next()
  );
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/compta/:path*",
    "/support/:path*",
    "/reporting/:path*",
    "/partner/:path*",
    "/franchise/:path*",
    "/dispatch/:path*",
  ],
};
