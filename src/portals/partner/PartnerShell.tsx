import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { NotificationBellButton } from "@/portals/shared/NotificationBellButton";
import { PartnerSosSoundListener } from "@/features/safety/components/PartnerSosSoundListener";
import { PartnerChatSoundListener } from "@/features/support/components/PartnerChatSoundListener";
import { PARTNER_NAV } from "./partnerNav";

export function PartnerShell({ children }: { children: React.ReactNode }) {
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
          scopeLabel="Ma flotte · Cocody Express"
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
