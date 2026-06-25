"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import {
  RENTAL_FUEL_POLICY_LABELS,
  type RentalPricing,
  type SaveRentalPricingPayload,
  type RentalFuelPolicy,
  type RentalSeasonRule,
} from "../api/rentalPricing.service";

const inputClass = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

const FUEL_POLICIES = Object.keys(RENTAL_FUEL_POLICY_LABELS) as RentalFuelPolicy[];

function emptyPricing(): SaveRentalPricingPayload {
  return {
    price_day_fcfa: 0,
    price_week_fcfa: undefined,
    price_month_fcfa: undefined,
    deposit_fcfa: 0,
    km_included: null,
    km_extra_fcfa: undefined,
    fuel_policy: "full_to_full",
    insurance_included: false,
    insurance_franchise_fcfa: undefined,
    penalties: {},
    option_fees: {},
    restrictions: "",
    promo: {},
    seasons: [],
  };
}

export function RentalPricingForm({
  initial,
  isSaving,
  onSubmit,
}: {
  initial?: RentalPricing | null;
  isSaving?: boolean;
  onSubmit: (data: SaveRentalPricingPayload) => void;
}) {
  const [form, setForm] = useState<SaveRentalPricingPayload>(() => {
    if (!initial) return emptyPricing();
    const { vehicle_id: _ignored, ...rest } = initial;
    void _ignored;
    return { ...emptyPricing(), ...rest };
  });
  const [unlimitedKm, setUnlimitedKm] = useState<boolean>(
    initial?.km_included == null
  );

  const num = (v: string): number | undefined => (v === "" ? undefined : Number(v));

  const setPenalty = (k: keyof NonNullable<SaveRentalPricingPayload["penalties"]>, v: unknown) =>
    setForm((f) => ({ ...f, penalties: { ...f.penalties, [k]: v } }));
  const setOptionFee = (
    k: keyof NonNullable<SaveRentalPricingPayload["option_fees"]>,
    v: number | undefined
  ) => setForm((f) => ({ ...f, option_fees: { ...f.option_fees, [k]: v } }));

  const addSeason = () =>
    setForm((f) => ({
      ...f,
      seasons: [
        ...(f.seasons ?? []),
        { label: "", start_date: "", end_date: "", modifier_percent: 0 },
      ],
    }));
  const updateSeason = (i: number, patch: Partial<RentalSeasonRule>) =>
    setForm((f) => ({
      ...f,
      seasons: (f.seasons ?? []).map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  const removeSeason = (i: number) =>
    setForm((f) => ({ ...f, seasons: (f.seasons ?? []).filter((_, idx) => idx !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, km_included: unlimitedKm ? null : form.km_included });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Tarifs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Prix / jour (FCFA) *">
            <input
              required
              type="number"
              min="0"
              className={inputClass}
              value={form.price_day_fcfa || ""}
              onChange={(e) => setForm({ ...form, price_day_fcfa: Number(e.target.value) })}
            />
          </Field>
          <Field label="Prix / semaine (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.price_week_fcfa ?? ""}
              onChange={(e) => setForm({ ...form, price_week_fcfa: num(e.target.value) })}
            />
          </Field>
          <Field label="Prix / mois (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.price_month_fcfa ?? ""}
              onChange={(e) => setForm({ ...form, price_month_fcfa: num(e.target.value) })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Caution & kilométrage">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Caution (FCFA) *">
            <input
              required
              type="number"
              min="0"
              className={inputClass}
              value={form.deposit_fcfa || ""}
              onChange={(e) => setForm({ ...form, deposit_fcfa: Number(e.target.value) })}
            />
          </Field>
          <Field label="Km inclus / jour">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                disabled={unlimitedKm}
                className={`${inputClass} disabled:opacity-50`}
                value={unlimitedKm ? "" : form.km_included ?? ""}
                onChange={(e) => setForm({ ...form, km_included: num(e.target.value) ?? null })}
              />
              <label className="flex shrink-0 items-center gap-1 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={unlimitedKm}
                  onChange={(e) => setUnlimitedKm(e.target.checked)}
                />
                Illimité
              </label>
            </div>
          </Field>
          <Field label="Coût km supplémentaire (FCFA)">
            <input
              type="number"
              min="0"
              disabled={unlimitedKm}
              className={`${inputClass} disabled:opacity-50`}
              value={form.km_extra_fcfa ?? ""}
              onChange={(e) => setForm({ ...form, km_extra_fcfa: num(e.target.value) })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Carburant & assurance">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Règle carburant">
            <select
              className={inputClass}
              value={form.fuel_policy}
              onChange={(e) =>
                setForm({ ...form, fuel_policy: e.target.value as RentalFuelPolicy })
              }
            >
              {FUEL_POLICIES.map((p) => (
                <option key={p} value={p}>
                  {RENTAL_FUEL_POLICY_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assurance incluse">
            <label className="flex h-[38px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.insurance_included}
                onChange={(e) => setForm({ ...form, insurance_included: e.target.checked })}
              />
              {form.insurance_included ? "Oui" : "Non"}
            </label>
          </Field>
          <Field label="Franchise assurance (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.insurance_franchise_fcfa ?? ""}
              onChange={(e) =>
                setForm({ ...form, insurance_franchise_fcfa: num(e.target.value) })
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Pénalités">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Retard / heure (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.penalties?.late_per_hour_fcfa ?? ""}
              onChange={(e) => setPenalty("late_per_hour_fcfa", num(e.target.value))}
            />
          </Field>
          <Field label="Retard / jour (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.penalties?.late_per_day_fcfa ?? ""}
              onChange={(e) => setPenalty("late_per_day_fcfa", num(e.target.value))}
            />
          </Field>
          <Field label="Frais d'annulation (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.penalties?.cancellation_fcfa ?? ""}
              onChange={(e) => setPenalty("cancellation_fcfa", num(e.target.value))}
            />
          </Field>
        </div>
      </Section>

      <Section title="Frais des options">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Chauffeur / jour (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.option_fees?.chauffeur_fcfa ?? ""}
              onChange={(e) => setOptionFee("chauffeur_fcfa", num(e.target.value))}
            />
          </Field>
          <Field label="Livraison (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.option_fees?.livraison_fcfa ?? ""}
              onChange={(e) => setOptionFee("livraison_fcfa", num(e.target.value))}
            />
          </Field>
          <Field label="Accessoires (FCFA)">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.option_fees?.accessoires_fcfa ?? ""}
              onChange={(e) => setOptionFee("accessoires_fcfa", num(e.target.value))}
            />
          </Field>
        </div>
      </Section>

      <Section title="Promotion & restrictions">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Code promo">
            <input
              className={inputClass}
              value={form.promo?.code ?? ""}
              onChange={(e) =>
                setForm({ ...form, promo: { ...form.promo, code: e.target.value } })
              }
            />
          </Field>
          <Field label="Réduction (%)">
            <input
              type="number"
              min="0"
              max="100"
              className={inputClass}
              value={form.promo?.percent ?? ""}
              onChange={(e) =>
                setForm({ ...form, promo: { ...form.promo, percent: num(e.target.value) } })
              }
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Restrictions (zone, usage, interdictions)">
            <textarea
              rows={2}
              className={`${inputClass} resize-none`}
              value={form.restrictions ?? ""}
              onChange={(e) => setForm({ ...form, restrictions: e.target.value })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Saisonnalité">
        <div className="space-y-3">
          {(form.seasons ?? []).map((s, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
              <input
                placeholder="Libellé (ex. Haute saison)"
                className={inputClass}
                value={s.label}
                onChange={(e) => updateSeason(i, { label: e.target.value })}
              />
              <input
                type="date"
                className={inputClass}
                value={s.start_date}
                onChange={(e) => updateSeason(i, { start_date: e.target.value })}
              />
              <input
                type="date"
                className={inputClass}
                value={s.end_date}
                onChange={(e) => updateSeason(i, { end_date: e.target.value })}
              />
              <input
                type="number"
                placeholder="% +/-"
                className={`${inputClass} w-24`}
                value={s.modifier_percent || ""}
                onChange={(e) =>
                  updateSeason(i, { modifier_percent: Number(e.target.value) })
                }
              />
              <button
                type="button"
                onClick={() => removeSeason(i)}
                className="rounded-lg px-3 text-sm text-red-600 hover:bg-red-50"
              >
                Retirer
              </button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addSeason}>
            + Ajouter une saison
          </Button>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer le barème"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-heading">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
