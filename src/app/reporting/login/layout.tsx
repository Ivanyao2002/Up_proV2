"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function ReportingLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard portal="reporting">{children}</GuestGuard>;
}
