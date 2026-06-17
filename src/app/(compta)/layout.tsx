"use client";

import { AuthGuard } from "@/core/auth/AuthGuard";
import { ComptaShell } from "@/portals/compta/ComptaShell";

export default function ComptaPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard portal="admin">
      <ComptaShell>{children}</ComptaShell>
    </AuthGuard>
  );
}
