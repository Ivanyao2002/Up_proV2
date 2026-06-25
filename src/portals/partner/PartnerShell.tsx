"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { useScope } from "@/core/auth/useScope";
import { PortalShellLayout } from "@/portals/shared/PortalShellLayout";
import { PortalTopbar } from "@/portals/shared/PortalTopbar";
import { NotificationBellButton } from "@/portals/shared/NotificationBellButton";
import { PartnerSosSoundListener } from "@/features/safety/components/PartnerSosSoundListener";
import { PartnerChatSoundListener } from "@/features/support/components/PartnerChatSoundListener";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";
import { PARTNER_NAV } from "./partnerNav";
import { partnerRouteModule } from "./partnerRouteModule";

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { hasModule } = useScope();
  const pathname = usePathname();
  const scopeLabel = user?.name ? `Ma flotte · ${user.name}` : "Ma flotte";

  // Filtrage par module métier (partner_type) : on masque les entrées des
  // modules non activés (ex. un loueur RENTAL ne voit pas les actions VTC).
  // Les groupes devenus vides sont retirés.
  const nav = useMemo(() => {
    return PARTNER_NAV.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.module || hasModule(item.module)),
    })).filter((group) => group.items.length > 0);
  }, [hasModule]);

  // Gating centralisé des routes : une page d'un module non activé est bloquée
  // (accès par URL directe), pas seulement masquée du menu.
  const routeModule = partnerRouteModule(pathname);
  const gatedChildren = routeModule ? (
    <PartnerModuleGuard module={routeModule}>{children}</PartnerModuleGuard>
  ) : (
    children
  );

  return (
    <PortalShellLayout
      nav={nav}
      subtitle="Partenaire"
      headerSlot={
        <>
          <PartnerChatSoundListener />
          <PartnerSosSoundListener />
        </>
      }
      topbar={(props) => (
        <PortalTopbar
          {...props}
          scopeLabel={scopeLabel}
          badge="Partenaire"
          loginPath="/partner/login"
          extraActions={<NotificationBellButton />}
        />
      )}
    >
      {gatedChildren}
    </PortalShellLayout>
  );
}
