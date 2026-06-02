import { useAuthStore } from "./authStore";

export function usePermission(permission: string): boolean {
  return useAuthStore((s) => s.hasPermission(permission));
}
