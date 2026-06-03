"use client";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import {
  useIntegrationsList,
  useToggleIntegration,
} from "../api/settingsExtended.queries";
import type { PlatformIntegration } from "../api/settingsExtended.service";

const CATEGORY_LABELS: Record<PlatformIntegration["category"], string> = {
  payment: "Paiement",
  maps: "Cartographie",
  messaging: "Messagerie",
  monitoring: "Monitoring",
};

export function SettingsIntegrationsPage() {
  const { data, isLoading, isError } = useIntegrationsList();
  const toggle = useToggleIntegration();

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les intégrations.</p>;
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Intégrations" breadcrumb={["Admin", "Paramètres"]} />

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-card bg-border" />
      ) : (
        <ul className="space-y-3">
          {(data?.data ?? []).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-5 shadow-card"
            >
              <div>
                <p className="font-medium text-navy">{item.name}</p>
                <p className="text-xs text-muted">
                  {CATEGORY_LABELS[item.category]}
                  {item.last_sync_at
                    ? ` · Sync ${formatDateTime(item.last_sync_at)}`
                    : " · Jamais synchronisé"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === "connected"
                      ? "bg-teal/15 text-teal-dark"
                      : "bg-canvas text-muted"
                  }`}
                >
                  {item.status === "connected" ? "Connecté" : "Déconnecté"}
                </span>
                <Button
                  variant="secondary"
                  className="!text-xs"
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({
                      id: item.id,
                      connected: item.status !== "connected",
                    })
                  }
                >
                  {item.status === "connected" ? "Déconnecter" : "Connecter"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
