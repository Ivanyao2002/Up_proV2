"use client";

import { SosIncidentDetailView } from "../components/SosIncidentDetailView";
import {
  useAcknowledgeSos,
  useResolveSos,
  useSosIncidentDetail,
} from "../api/sos.queries";
import { ADMIN_SOS_ROUTES } from "../lib/sosPortalConfig";

interface SosIncidentDetailPageProps {
  incidentId: string;
}

export function SosIncidentDetailPage({ incidentId }: SosIncidentDetailPageProps) {
  return (
    <SosIncidentDetailView
      incidentId={incidentId}
      routes={ADMIN_SOS_ROUTES}
      breadcrumb={["Admin", "Opérations", "SOS"]}
      useIncidentDetail={useSosIncidentDetail}
      useAcknowledge={useAcknowledgeSos}
      useResolve={useResolveSos}
    />
  );
}
