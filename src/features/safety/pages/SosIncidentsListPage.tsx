"use client";

import { SosIncidentsListView } from "../components/SosIncidentsListView";
import { useSosIncidentsList } from "../api/sos.queries";
import { ADMIN_SOS_ROUTES } from "../lib/sosPortalConfig";

export function SosIncidentsListPage() {
  return (
    <SosIncidentsListView
      routes={ADMIN_SOS_ROUTES}
      breadcrumb={["Admin", "Opérations", "SOS"]}
      useIncidentsList={useSosIncidentsList}
    />
  );
}
