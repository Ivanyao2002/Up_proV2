import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS: Record<string, string[]> = {
  admin: ["/admin/login"],
  partner: ["/partner/login"],
  franchise: ["/franchise/login"],
};

function guardPortal(
  request: NextRequest,
  prefix: "/admin" | "/partner" | "/franchise",
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
    const login = new URL(loginPath, request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export function middleware(request: NextRequest) {
  return (
    guardPortal(request, "/admin", "/admin/login") ??
    guardPortal(request, "/partner", "/partner/login") ??
    guardPortal(request, "/franchise", "/franchise/login") ??
    NextResponse.next()
  );
}

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*", "/franchise/:path*"],
};
