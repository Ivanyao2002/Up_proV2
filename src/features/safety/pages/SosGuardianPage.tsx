"use client";

import { SosGuardianView } from "../components/SosGuardianView";
import { useSosDashboard } from "../api/sos.queries";
import { ADMIN_SOS_ROUTES } from "../lib/sosPortalConfig";

export function SosGuardianPage() {
  const query = useSosDashboard();

  return (
    <SosGuardianView
      routes={ADMIN_SOS_ROUTES}
      breadcrumb={["Admin", "Opérations", "SOS"]}
      data={query.data}
      isLoading={query.isLoading}
      isError={query.isError}
      dataUpdatedAt={query.dataUpdatedAt}
      isFetching={query.isFetching}
    />
  );
}
