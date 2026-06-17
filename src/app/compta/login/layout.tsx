"use client";

import { GuestGuard } from "@/core/auth/GuestGuard";

export default function ComptaLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GuestGuard portal="admin">{children}</GuestGuard>;
}
