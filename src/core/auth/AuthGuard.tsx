"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "./authStore";
import { clearAuthCookie, hasAuthCookie, setAuthCookie } from "./authCookie";
import { LOGIN_BY_PORTAL } from "./authRoutes";
import { buildLoginUrlWithReturn } from "./returnUrl";
import { useAuthHydrated } from "./useAuthHydrated";
import { useAuthMeQuery } from "@/features/auth/api/auth.queries";
import type { PortalRole } from "@/shared/types";

interface AuthGuardProps {
  portal: PortalRole;
  children: ReactNode;
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
    </div>
  );
}

export function AuthGuard({ portal, children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { isError: meFailed } = useAuthMeQuery();

  useEffect(() => {
    if (!meFailed) return;
    useAuthStore.getState().clearSession();
    clearAuthCookie();
    router.replace(buildLoginUrlWithReturn(LOGIN_BY_PORTAL[portal], pathname));
  }, [meFailed, portal, router, pathname]);

  useEffect(() => {
    if (!hydrated) return;

    if (token && user && !hasAuthCookie()) {
      setAuthCookie();
    }
    if (!token || !user) {
      router.replace(buildLoginUrlWithReturn(LOGIN_BY_PORTAL[portal], pathname));
      return;
    }
    if (user.role !== portal) {
      router.replace(LOGIN_BY_PORTAL[user.role] ?? "/login");
    }
  }, [hydrated, token, user, portal, router, pathname]);

  if (!hydrated || !token || !user) {
    return <AuthLoading />;
  }

  if (user.role !== portal) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
