"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { clearAuthCookie } from "@/core/auth/authCookie";
import { Button } from "@/shared/ui/Button";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

interface PortalTopbarProps {
  scopeLabel: string;
  badge: string;
  loginPath: string;
}

export function PortalTopbar({ scopeLabel, badge, loginPath }: PortalTopbarProps) {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
        {scopeLabel}
      </span>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
        <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-medium text-teal-dark">
          {badge}
        </span>
        <Button
          variant="ghost"
          className="!py-1.5 !px-2 text-xs"
          onClick={() => {
            clearSession();
            clearAuthCookie();
            window.location.href = loginPath;
          }}
        >
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
