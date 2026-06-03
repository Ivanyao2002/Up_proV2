"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { MarketingCampaign } from "../api/marketing.service";
import { useCreateMarketingCampaign } from "../api/marketing.queries";

export function MarketingCampaignNewPage() {
  const router = useRouter();
  const create = useCreateMarketingCampaign();
  const [values, setValues] = useState({
    name: "",
    channel: "push" as MarketingCampaign["channel"],
    audience: "",
    status: "draft" as MarketingCampaign["status"],
    starts_at: new Date().toISOString().slice(0, 10),
    ends_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <div className="animate-fade-up mx-auto w-full max-w-lg px-4 pb-10">
      <PageHeader
        title="Nouvelle campagne"
        breadcrumb={["Admin", "Marketing", "Campagnes", "Nouvelle"]}
      />

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            {
              name: values.name,
              channel: values.channel,
              audience: values.audience,
              status: values.status,
              starts_at: new Date(values.starts_at).toISOString(),
              ends_at: new Date(values.ends_at).toISOString(),
            },
            { onSuccess: () => router.push("/admin/marketing/campaigns") }
          );
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Nom</span>
          <input
            required
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Canal</span>
          <select
            value={values.channel}
            onChange={(e) => set({ channel: e.target.value as MarketingCampaign["channel"] })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="push">Push</option>
            <option value="sms">SMS</option>
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Audience</span>
          <input
            required
            value={values.audience}
            onChange={(e) => set({ audience: e.target.value })}
            placeholder="Ex. Clients actifs Cocody"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Début</span>
            <input
              type="date"
              required
              value={values.starts_at}
              onChange={(e) => set({ starts_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Fin</span>
            <input
              type="date"
              required
              value={values.ends_at}
              onChange={(e) => set({ ends_at: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Statut</span>
          <select
            value={values.status}
            onChange={(e) => set({ status: e.target.value as MarketingCampaign["status"] })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="draft">Brouillon</option>
            <option value="scheduled">Planifiée</option>
            <option value="running">En cours</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            Créer
          </Button>
        </div>
      </form>
    </div>
  );
}
