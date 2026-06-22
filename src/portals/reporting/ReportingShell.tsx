import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { ReportingTopbar } from "./ReportingTopbar";
import { REPORTING_NAV } from "./reportingNav";

export function ReportingShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalShellLayout
      nav={REPORTING_NAV}
      subtitle="Reporting"
      topbar={(props) => <ReportingTopbar {...props} />}
    >
      {children}
    </PortalShellLayout>
  );
}
