import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { FranchiseSosSoundListener } from "@/features/safety/components/FranchiseSosSoundListener";
import { FranchiseChatSoundListener } from "@/features/support/components/FranchiseChatSoundListener";
import { FRANCHISE_NAV } from "./franchiseNav";

export function FranchiseShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellLayout
      nav={FRANCHISE_NAV}
      subtitle="Franchise"
      headerSlot={
        <>
          <FranchiseChatSoundListener />
          <FranchiseSosSoundListener />
        </>
      }
      topbar={(props) => (
        <PortalTopbar
          {...props}
          scopeLabel="Pays · Côte d'Ivoire"
          badge="Franchise"
          loginPath="/franchise/login"
        />
      )}
    >
      {children}
    </PortalShellLayout>
  );
}
