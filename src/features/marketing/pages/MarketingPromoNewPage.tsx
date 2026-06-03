"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import type { MarketingPromo } from "../api/marketing.service";
import { useCreateMarketingPromo } from "../api/marketing.queries";

export function MarketingPromoNewPage() {
  const router = useRouter();
  const create = useCreateMarketingPromo();
  const [values, setValues] = useState({
    code: "",
    label: "",
    discount_pct: 10,
    fixed_discount_fcfa: undefined as number | undefined,
    max_uses: 1000,
    status: "draft" as MarketingPromo["status"],
    expires_at: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  });
  const [useFixed, setUseFixed] = useState(false);

  const set = (patch: Partial<typeof values>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <div className="animate-fade-up mx-auto w-full max-w-lg px-4 pb-10">
      <PageHeader
        title="Nouveau code promo"
        breadcrumb={["Admin", "Marketing", "Promos", "Nouveau"]}
      />

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            {
              code: values.code,
              label: values.label,
              discount_pct: useFixed ? 0 : values.discount_pct,
              fixed_discount_fcfa: useFixed ? values.fixed_discount_fcfa : undefined,
              max_uses: values.max_uses,
              status: values.status,
              expires_at: new Date(values.expires_at).toISOString(),
            },
            { onSuccess: () => router.push("/admin/marketing/promos") }
          );
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Code</span>
          <input
            required
            value={values.code}
            onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 font-mono text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Libellé</span>
          <input
            required
            value={values.label}
            onChange={(e) => set({ label: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useFixed} onChange={(e) => setUseFixed(e.target.checked)} />
          Montant fixe (FCFA) plutôt que pourcentage
        </label>
        {useFixed ? (
          <label className="block">
            <span className="text-sm font-medium">Réduction fixe (FCFA)</span>
            <input
              type="number"
              min={1}
              required
              value={values.fixed_discount_fcfa ?? ""}
              onChange={(e) => set({ fixed_discount_fcfa: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-medium">Réduction (%)</span>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={values.discount_pct}
              onChange={(e) => set({ discount_pct: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium">Utilisations max</span>
          <input
            type="number"
            min={1}
            required
            value={values.max_uses}
            onChange={(e) => set({ max_uses: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Expiration</span>
          <input
            type="date"
            required
            value={values.expires_at}
            onChange={(e) => set({ expires_at: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Statut</span>
          <select
            value={values.status}
            onChange={(e) => set({ status: e.target.value as MarketingPromo["status"] })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="draft">Brouillon</option>
            <option value="active">Actif</option>
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
