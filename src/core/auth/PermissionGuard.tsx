"use client";

import type { ReactNode } from "react";
import { usePermission } from "./usePermission";

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const allowed = usePermission(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
