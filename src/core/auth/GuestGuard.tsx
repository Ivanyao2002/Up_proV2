"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./authStore";
import { DASHBOARD_BY_PORTAL, canAccessPortal } from "./authRoutes";
import { readReturnUrlFromLocation } from "./returnUrl";
import { useAuthHydrated } from "./useAuthHydrated";
import type { PortalRole } from "@/shared/types";

interface GuestGuardProps {
  /** Portail attendu sur cette page de login ; si absent, redirige vers le dashboard du rôle connecté. */
  portal?: PortalRole;
  children: ReactNode;
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
    </div>
  );
}

/**
 * Inverse de AuthGuard : si l'utilisateur est déjà connecté, redirection vers le dashboard.
 */
export function GuestGuard({ portal, children }: GuestGuardProps) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user) return;

    const fallback =
      portal && canAccessPortal(user.role, portal)
        ? DASHBOARD_BY_PORTAL[portal]
        : DASHBOARD_BY_PORTAL[user.role];
    const target = readReturnUrlFromLocation(
      fallback,
      portal && canAccessPortal(user.role, portal) ? portal : user.role
    );

    router.replace(target);
  }, [hydrated, isAuthenticated, user, portal, router]);

  if (!hydrated) return <AuthLoading />;
  if (isAuthenticated) return <AuthLoading />;

  return <>{children}</>;
}
