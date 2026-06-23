"use client";

// import { GuestGuard } from "@/core/auth/GuestGuard";

export default function FranchiseLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Remettre GuestGuard après correction du problème d'hydratation
  // return <GuestGuard portal="franchise">{children}</GuestGuard>;
  return <>{children}</>;
}
