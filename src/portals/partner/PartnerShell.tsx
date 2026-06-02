import { PortalSidebar } from "@/portals/shared/PortalSidebar";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { PARTNER_NAV } from "./partnerNav";

export function PartnerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <PortalSidebar nav={PARTNER_NAV} subtitle="Partenaire" />
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar
          scopeLabel="Ma flotte · Cocody Express"
          badge="Partenaire"
          loginPath="/partner/login"
        />
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
