"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { AdminAssistantTopbarButton } from "@/features/assistant/components/AdminAssistantProvider";
import { TicketNotificationBell } from "@/features/support/components/TicketNotificationBell";
import { MobileNavToggle } from "@/portals/shared/MobileNavToggle";
import type { PortalShellTopbarProps } from "@/portals/shared/PortalShellLayout";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

export function Topbar({ onMenuToggle, mobileNavOpen }: PortalShellTopbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <MobileNavToggle onClick={onMenuToggle} open={mobileNavOpen} />
        <button
          type="button"
          className="hidden rounded-lg border border-border px-3 py-1.5 text-xs text-muted md:inline-flex"
          title="Recherche globale"
        >
          ⌘K Rechercher…
        </button>
        <span className="hidden min-w-0 truncate rounded-full bg-canvas px-3 py-1 text-xs text-muted sm:inline-block">
          Abidjan · Toutes franchises
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <AdminAssistantTopbarButton />
        <TicketNotificationBell />
        <ThemeToggle />
        <span className="hidden max-w-[8rem] truncate text-sm text-muted sm:inline md:max-w-none">
          {user?.name}
        </span>
        <span className="hidden rounded-full bg-teal-soft px-2.5 py-1 text-xs font-medium text-foreground-display sm:inline">
          Administrateur
        </span>
        <LogoutButton loginPath="/admin/login" />
      </div>
    </header>
  );
}
