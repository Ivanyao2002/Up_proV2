"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/core/auth/authStore";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { AdminAssistantTopbarButton } from "@/features/assistant/components/AdminAssistantProvider";
import { TicketNotificationBell } from "@/features/support/components/TicketNotificationBell";
import { MobileNavToggle } from "@/portals/shared/MobileNavToggle";
import {
  CommandPalette,
  type CommandPaletteItem,
} from "@/portals/shared/CommandPalette";
import type { PortalShellTopbarProps } from "@/portals/shared/PortalShellLayout";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { ADMIN_NAV } from "./adminNav";

export function Topbar({ onMenuToggle, mobileNavOpen }: PortalShellTopbarProps) {
  const user = useAuthStore((s) => s.user);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const navItems = useMemo<CommandPaletteItem[]>(
    () =>
      ADMIN_NAV.flatMap((group) =>
        group.items.map((item) => ({ label: item.label, href: item.path })),
      ),
    [],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <MobileNavToggle onClick={onMenuToggle} open={mobileNavOpen} />
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground sm:flex"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="truncate">Rechercher</span>
          <kbd className="ml-1 rounded border border-border px-1.5 text-[11px] font-medium text-muted">
            ⌘K
          </kbd>
        </button>
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
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={navItems}
      />
    </header>
  );
}
