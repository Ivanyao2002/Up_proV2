import { useAuthStore } from "./authStore";

export function useScope() {
  const user = useAuthStore((s) => s.user);

  return {
    scope: user?.scope ?? "platform",
    franchiseId: user?.franchise_id,
    ownerId: user?.owner_id,
    role: user?.role,
  };
}
