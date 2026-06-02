import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/shared/types";

interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
      hasPermission: (permission) => {
        const perms = get().user?.permissions ?? [];
        return perms.includes(permission);
      },
    }),
    { name: "upjunoo-auth" }
  )
);
