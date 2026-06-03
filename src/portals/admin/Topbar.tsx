"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { clearAuthCookie } from "@/core/auth/authCookie";
import { Button } from "@/shared/ui/Button";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden rounded-lg border border-border px-3 py-1.5 text-xs text-muted md:inline-flex"
          title="Recherche globale"
        >
          ⌘K Rechercher…
        </button>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
          Abidjan · Toutes franchises
        </span>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
        <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-medium text-foreground-display">
          Administrateur
        </span>
        <Button
          variant="ghost"
          className="!py-1.5 !px-2 text-xs"
          onClick={() => {
            clearSession();
            clearAuthCookie();
            window.location.href = "/admin/login";
          }}
        >
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
