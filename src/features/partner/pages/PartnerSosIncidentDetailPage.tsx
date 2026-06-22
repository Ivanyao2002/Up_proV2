"use client";

import { SosIncidentDetailView } from "@/features/safety/components/SosIncidentDetailView";
import { PARTNER_SOS_ROUTES } from "@/features/safety/lib/sosPortalConfig";
import {
  usePartnerAcknowledgeSos,
  usePartnerResolveSos,
  usePartnerSosIncidentDetail,
} from "../api/partnerSos.queries";

interface PartnerSosIncidentDetailPageProps {
  incidentId: string;
}

export function PartnerSosIncidentDetailPage({
  incidentId,
}: PartnerSosIncidentDetailPageProps) {
  return (
    <SosIncidentDetailView
      incidentId={incidentId}
      routes={PARTNER_SOS_ROUTES}
      breadcrumb={["Partenaire", "Sécurité"]}
      useIncidentDetail={usePartnerSosIncidentDetail}
      useAcknowledge={usePartnerAcknowledgeSos}
      useResolve={usePartnerResolveSos}
    />
  );
}
