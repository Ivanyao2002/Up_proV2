"use client";

import { SosIncidentsListView } from "@/features/safety/components/SosIncidentsListView";
import { PARTNER_SOS_ROUTES } from "@/features/safety/lib/sosPortalConfig";
import { usePartnerSosIncidentsList } from "../api/partnerSos.queries";

export function PartnerSosIncidentsListPage() {
  return (
    <SosIncidentsListView
      routes={PARTNER_SOS_ROUTES}
      breadcrumb={["Partenaire", "Sécurité"]}
      useIncidentsList={usePartnerSosIncidentsList}
    />
  );
}
