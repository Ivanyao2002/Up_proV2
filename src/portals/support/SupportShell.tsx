import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { SupportTopbar } from "./SupportTopbar";
import { SUPPORT_NAV } from "./supportNav";

export function SupportShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellLayout
      nav={SUPPORT_NAV}
      subtitle="Support"
      topbar={(props) => <SupportTopbar {...props} />}
    >
      {children}
    </PortalShellLayout>
  );
}
