"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { NotificationBellButton } from "@/portals/shared/NotificationBellButton";
import { DISPATCH_NAV } from "./dispatchNav";

export function DispatchShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const zones =
    user?.zone_names?.length ? user.zone_names.join(" · ") : "Zones assignées";

  return (
    <PortalShellLayout
      nav={DISPATCH_NAV}
      subtitle="Dispatch"
      topbar={(props) => (
        <PortalTopbar
          {...props}
          scopeLabel={`Dispatch · ${zones}`}
          badge="Dispatcher"
          loginPath="/dispatch/login"
          extraActions={<NotificationBellButton href="/dispatch/console" />}
        />
      )}
    >
      {children}
    </PortalShellLayout>
  );
}
