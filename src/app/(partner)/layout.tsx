"use client";

import { AuthGuard } from "@/core/auth/AuthGuard";
import { PartnerShell } from "@/portals/partner/PartnerShell";

export default function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard portal="partner">
      <PartnerShell>{children}</PartnerShell>
    </AuthGuard>
  );
}
