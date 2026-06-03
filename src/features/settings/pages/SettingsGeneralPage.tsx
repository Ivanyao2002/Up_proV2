"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import type { GeneralSettings } from "../api/settingsExtended.service";
import {
  useGeneralSettings,
  useUpdateGeneralSettings,
} from "../api/settingsExtended.queries";

export function SettingsGeneralPage() {
  const { data, isLoading, isError } = useGeneralSettings();
  const update = useUpdateGeneralSettings();
  const [form, setForm] = useState<GeneralSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les paramètres généraux.</p>
    );
  }

  const set = (patch: Partial<GeneralSettings>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Paramètres généraux" breadcrumb={["Admin", "Paramètres"]} />

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate(form);
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Nom plateforme</span>
          <input
            value={form.platform_name}
            onChange={(e) => set({ platform_name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Email support</span>
          <input
            type="email"
            value={form.support_email}
            onChange={(e) => set({ support_email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Ville par défaut</span>
            <input
              value={form.default_city}
              onChange={(e) => set({ default_city: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Devise</span>
            <input
              value={form.default_currency}
              onChange={(e) => set({ default_currency: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Version min. app chauffeur</span>
            <input
              value={form.min_app_version_driver}
              onChange={(e) => set({ min_app_version_driver: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Version min. app client</span>
            <input
              value={form.min_app_version_client}
              onChange={(e) => set({ min_app_version_client: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.maintenance_mode}
            onChange={(e) => set({ maintenance_mode: e.target.checked })}
            className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
          />
          <span className="text-sm font-medium">Mode maintenance activé</span>
        </label>

        <p className="text-xs text-muted">
          Dernière mise à jour : {formatDateTime(form.updated_at)}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => data && setForm(data)}>
            Réinitialiser
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
