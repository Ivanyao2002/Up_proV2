import { useAuthStore } from "./authStore";
import type { PartnerType } from "@/shared/types";

export function useScope() {
  const user = useAuthStore((s) => s.user);

  return {
    scope: user?.scope ?? "platform",
    franchiseId: user?.franchise_id,
    ownerId: user?.owner_id,
    role: user?.role,
    partnerType: user?.partner_type as PartnerType | undefined,
    /** Vérifie si le partenaire a accès à un module (freight / rental) */
    hasModule: (module: "freight" | "rental"): boolean => {
      const t = user?.partner_type;
      if (!t) return true; // fallback permissif si type inconnu
      if (module === "freight") return t === "FREIGHT" || t === "MIXED";
      if (module === "rental") return t === "RENTAL" || t === "MIXED";
      return false;
    },
  };
}
