"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import type { FinanceCapsConfig } from "../api/financeCaps.service";
import { useFinanceCaps, useUpdateFinanceCaps } from "../api/financeCaps.queries";

function CapField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      <input
        type="number"
        min={0}
        step={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm tabular-nums outline-none ring-teal/30 focus:ring-2"
      />
      <p className="mt-1 text-xs text-muted">{formatFCFA(value)}</p>
    </label>
  );
}

export function FinanceCapsPage() {
  const { data, isLoading, isError } = useFinanceCaps();
  const update = useUpdateFinanceCaps();
  const [form, setForm] = useState<FinanceCapsConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <SimplePageSkeleton />;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les plafonds finance.</p>
    );
  }

  const set = (patch: Partial<FinanceCapsConfig>) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Plafonds & seuils finance"
        breadcrumb={["Admin", "Paramètres"]}
      />

      <p className="mb-4 text-sm text-muted">
        Plafonds de retrait journaliers et seuils portefeuille chauffeur (dispatch, alerte).
        Valeurs par défaut : 10 000 F / 30 000 F selon la doc finance.
      </p>

      <form
        className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate(form);
        }}
      >
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            Plafonds retrait (par jour)
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <CapField
              label="Chauffeur"
              hint="Maximum retirable par chauffeur et par jour"
              value={form.driver_withdrawal_daily_cap_xof}
              onChange={(v) => set({ driver_withdrawal_daily_cap_xof: v })}
            />
            <CapField
              label="Partenaire"
              hint="Maximum retirable par partenaire et par jour"
              value={form.partner_withdrawal_daily_cap_xof}
              onChange={(v) => set({ partner_withdrawal_daily_cap_xof: v })}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-border pt-6">
          <legend className="text-sm font-semibold text-foreground">
            Seuils portefeuille chauffeur
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <CapField
              label="Minimum dispatch"
              hint="Solde minimum pour recevoir des courses"
              value={form.driver_wallet_dispatch_min_xof}
              onChange={(v) => set({ driver_wallet_dispatch_min_xof: v })}
            />
            <CapField
              label="Alerte solde bas"
              hint="Seuil d'alerte affiché au chauffeur"
              value={form.driver_wallet_low_balance_alert_xof}
              onChange={(v) => set({ driver_wallet_low_balance_alert_xof: v })}
            />
          </div>
        </fieldset>

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
