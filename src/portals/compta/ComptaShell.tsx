import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { ComptaTopbar } from "./ComptaTopbar";
import { COMPTA_NAV } from "./comptaNav";

export function ComptaShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellLayout
      nav={COMPTA_NAV}
      subtitle="Comptabilité"
      topbar={(props) => <ComptaTopbar {...props} />}
    >
      {children}
    </PortalShellLayout>
  );
}
