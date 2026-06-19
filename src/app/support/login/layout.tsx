"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function SupportLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard portal="support">{children}</GuestGuard>;
}
