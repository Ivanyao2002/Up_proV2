"use client";

import { AuthGuard } from "@/core/auth/AuthGuard";
import { SupportShell } from "@/portals/support/SupportShell";

export default function SupportPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard portal="support">
      <SupportShell>{children}</SupportShell>
    </AuthGuard>
  );
}
