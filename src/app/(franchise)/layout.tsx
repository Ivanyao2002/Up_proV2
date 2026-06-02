"use client";

import { AuthGuard } from "@/core/auth/AuthGuard";
import { FranchiseShell } from "@/portals/franchise/FranchiseShell";

export default function FranchisePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard portal="franchise">
      <FranchiseShell>{children}</FranchiseShell>
    </AuthGuard>
  );
}
