"use client";

import { SosGuardianView } from "@/features/safety/components/SosGuardianView";
import { PARTNER_SOS_ROUTES } from "@/features/safety/lib/sosPortalConfig";
import { usePartnerSosDashboard } from "../api/partnerSos.queries";

export function PartnerSosGuardianPage() {
  const query = usePartnerSosDashboard();

  return (
    <SosGuardianView
      routes={PARTNER_SOS_ROUTES}
      breadcrumb={["Partenaire", "Sécurité"]}
      subtitle="Surveillance temps réel des incidents SOS de votre flotte. Rafraîchissement automatique toutes les 30 secondes."
      data={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
      dataUpdatedAt={query.dataUpdatedAt}
      isFetching={query.isFetching}
    />
  );
}
