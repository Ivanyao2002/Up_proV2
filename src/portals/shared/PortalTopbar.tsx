"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { MobileNavToggle } from "@/portals/shared/MobileNavToggle";
import type { PortalShellTopbarProps } from "@/portals/shared/PortalShellLayout";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

interface PortalTopbarProps extends PortalShellTopbarProps {
  scopeLabel: string;
  badge: string;
  loginPath: string;
  extraActions?: React.ReactNode;
}

export function PortalTopbar({
  scopeLabel,
  badge,
  loginPath,
  extraActions,
  onMenuToggle,
  mobileNavOpen,
}: PortalTopbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MobileNavToggle onClick={onMenuToggle} open={mobileNavOpen} />
        <span className="min-w-0 truncate rounded-full bg-canvas px-3 py-1 text-xs text-muted">
          {scopeLabel}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {extraActions}
        <ThemeToggle />
        <span className="hidden max-w-[8rem] truncate text-sm text-muted sm:inline md:max-w-none">
          {user?.name}
        </span>
        <span className="rounded-full bg-teal-soft px-2.5 py-1 text-xs font-medium text-teal-dark">
          {badge}
        </span>
        <LogoutButton loginPath={loginPath} />
      </div>
    </header>
  );
}
