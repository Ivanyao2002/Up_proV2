"use client";

import { AuthGuard } from "@/core/auth/AuthGuard";
import { ReportingShell } from "@/portals/reporting/ReportingShell";

export default function ReportingPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard portal="reporting">
      <ReportingShell>{children}</ReportingShell>
    </AuthGuard>
  );
}
