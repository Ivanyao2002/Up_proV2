"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { MarketingBanner } from "../api/marketing.service";
import { useCreateMarketingBanner } from "../api/marketing.queries";

export function MarketingBannerNewPage() {
  const router = useRouter();
  const create = useCreateMarketingBanner();
  const [values, setValues] = useState({
    title: "",
    placement: "home_hero",
    status: "draft" as MarketingBanner["status"],
    starts_at: new Date().toISOString().slice(0, 10),
    ends_at: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <div className="animate-fade-up mx-auto w-full max-w-lg px-4 pb-10">
      <PageHeader
        title="Nouvelle bannière"
        breadcrumb={["Admin", "Marketing", "Bannières", "Nouvelle"]}
      />

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            {
              title: values.title,
              placement: values.placement,
              status: values.status,
              starts_at: new Date(values.starts_at).toISOString(),
              ends_at: new Date(values.ends_at).toISOString(),
            },
            { onSuccess: () => router.push("/admin/marketing/banners") }
          );
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Titre</span>
          <input
            required
            value={values.title}
            onChange={(e) => set({ title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Emplacement</span>
          <select
            value={values.placement}
            onChange={(e) => set({ placement: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="home_hero">Accueil — hero</option>
            <option value="driver_app">App chauffeur</option>
            <option value="partner_portal">Portail partenaire</option>
          </select>
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
            onChange={(e) => set({ status: e.target.value as MarketingBanner["status"] })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="draft">Brouillon</option>
            <option value="active">Active</option>
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
