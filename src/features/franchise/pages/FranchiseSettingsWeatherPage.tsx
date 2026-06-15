"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import type { WeatherConfigDocument } from "@/features/settings/api/adminPlatformConfig.api.types";
import {
  useFranchiseWeatherConfig,
  useRefreshFranchiseWeather,
  useUpdateFranchiseWeatherConfig,
} from "../api/franchiseSettings.queries";

export function FranchiseSettingsWeatherPage() {
  const { data, isLoading, isError } = useFranchiseWeatherConfig();
  const update = useUpdateFranchiseWeatherConfig();
  const refresh = useRefreshFranchiseWeather();
  const [form, setForm] = useState<WeatherConfigDocument | null>(null);

  useEffect(() => {
    if (data?.document) setForm({ ...data.document });
  }, [data?.document]);

  if (isLoading || !form) return <SimplePageSkeleton />;

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger la configuration météo.</p>
    );
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Météo & surge"
        breadcrumb={["Franchise", "Paramètres", "Météo"]}
        actions={
          <Button
            variant="secondary"
            disabled={refresh.isPending}
            onClick={() => refresh.mutate()}
          >
            {refresh.isPending ? "Planification…" : "Refresh manuel"}
          </Button>
        }
      />

      <p className="mb-4 text-sm text-muted">
        Configuration du service météo pour le calcul du surge pricing sur votre territoire.
      </p>

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate(form);
        }}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
          />
          Service météo activé
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Seuil chaleur (°C)</span>
            <input
              type="number"
              value={form.heatThresholdCelsius ?? 35}
              onChange={(e) =>
                setForm({
                  ...form,
                  heatThresholdCelsius: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">TTL cache (s)</span>
            <input
              type="number"
              value={form.cacheTtlSeconds ?? 900}
              onChange={(e) =>
                setForm({ ...form, cacheTtlSeconds: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Intervalle refresh auto (min)</span>
          <input
            type="number"
            value={form.refresh?.intervalMinutes ?? 15}
            onChange={(e) =>
              setForm({
                ...form,
                refresh: {
                  ...form.refresh,
                  intervalMinutes: Number(e.target.value),
                },
              })
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.refresh?.enabled ?? false}
            onChange={(e) =>
              setForm({
                ...form,
                refresh: { ...form.refresh, enabled: e.target.checked },
              })
            }
          />
          Refresh automatique (BullMQ)
        </label>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
