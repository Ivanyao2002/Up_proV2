"use client";

import { AuthGuard } from "@/core/auth/AuthGuard";
import { AdminShell } from "@/portals/admin/AdminShell";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard portal="admin">
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
