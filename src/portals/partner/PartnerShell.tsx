"use client";

import { useAuthStore } from "@/core/auth/authStore";
import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { NotificationBellButton } from "@/portals/shared/NotificationBellButton";
import { PartnerSosSoundListener } from "@/features/safety/components/PartnerSosSoundListener";
import { PartnerChatSoundListener } from "@/features/support/components/PartnerChatSoundListener";
import { PARTNER_NAV } from "./partnerNav";

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const scopeLabel = user?.name ? `Ma flotte · ${user.name}` : "Ma flotte";

  return (
    <PortalShellLayout
      nav={PARTNER_NAV}
      subtitle="Partenaire"
      headerSlot={
        <>
          <PartnerChatSoundListener />
          <PartnerSosSoundListener />
        </>
      }
      topbar={(props) => (
        <PortalTopbar
          {...props}
          scopeLabel={scopeLabel}
          badge="Partenaire"
          loginPath="/partner/login"
          extraActions={<NotificationBellButton />}
        />
      )}
    >
      {children}
    </PortalShellLayout>
  );
}
