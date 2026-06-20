import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { SupportRealtimeListener } from "@/features/support/components/SupportRealtimeListener";
import { SupportTopbar } from "./SupportTopbar";
import { SUPPORT_NAV } from "./supportNav";

export function SupportShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellLayout
      nav={SUPPORT_NAV}
      subtitle="Support"
      sidebarAppearance="support"
      topbar={(props) => <SupportTopbar {...props} />}
      headerSlot={<SupportRealtimeListener />}
    >
      {children}
    </PortalShellLayout>
  );
}
