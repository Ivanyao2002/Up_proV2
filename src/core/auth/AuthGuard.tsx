"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./authStore";
import { hasAuthCookie, setAuthCookie } from "./authCookie";
import type { PortalRole } from "@/shared/types";

const LOGIN_BY_PORTAL: Record<PortalRole, string> = {
  admin: "/admin/login",
  partner: "/partner/login",
  franchise: "/franchise/login",
  dispatch: "/admin/login",
};

interface AuthGuardProps {
  portal: PortalRole;
  children: ReactNode;
}

export function AuthGuard({ portal, children }: AuthGuardProps) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (token && user && !hasAuthCookie()) {
      setAuthCookie();
    }
    if (!token || !user) {
      router.replace(LOGIN_BY_PORTAL[portal]);
      return;
    }
    if (user.role !== portal && portal !== "admin") {
      router.replace(LOGIN_BY_PORTAL[user.role] ?? "/login");
    }
  }, [token, user, portal, router]);

  if (!token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
