"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { MobileNavToggle } from "@/portals/shared/MobileNavToggle";
import type { PortalShellTopbarProps } from "@/portals/shared/PortalShellLayout";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

export function ComptaTopbar({ onMenuToggle, mobileNavOpen }: PortalShellTopbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <MobileNavToggle onClick={onMenuToggle} open={mobileNavOpen} />
        <span className="hidden min-w-0 truncate text-sm font-medium text-heading sm:inline">
          Interface comptable
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <span className="hidden max-w-[8rem] truncate text-sm text-muted sm:inline md:max-w-none">
          {user?.name}
        </span>
        <span className="hidden rounded-full bg-teal-soft px-2.5 py-1 text-xs font-medium text-foreground-display sm:inline">
          Comptabilité
        </span>
        <LogoutButton loginPath="/admin/login" />
      </div>
    </header>
  );
}
