"use client";

import type { PricingRule } from "@/shared/types";
import { Button } from "@/shared/ui/Button";
import { ZoneTypePill } from "@/shared/ui/ZoneTypePill";
import type { ZoneMapItem } from "@/features/network/components/AbidjanZonesMap";
import { SERVICE_LABELS } from "@/shared/lib/tripLabels";
import { PRICING_CATEGORY_OPTIONS } from "../api/adminPricing.mapper";

export interface PricingFranchiseOption {
  id: number | string;
  name: string;
  city: string;
}

export interface PricingFormValues {
  franchise_id: number | string | null;
  franchise_name?: string;
  zone_id: number | string | null;
  zone_name: string;
  rule_name?: string;
  category_code?: string;
  service: PricingRule["service"];
  base_fare_fcfa: number;
  per_km_fcfa: number;
  min_fare_fcfa: number;
  surge_multiplier: number;
  status: PricingRule["status"];
  effectiveFrom?: string;
}

interface PricingFormProps {
  values: PricingFormValues;
  selectedZone?: ZoneMapItem | null;
  franchiseOptions?: PricingFranchiseOption[];
  hideFranchise?: boolean;
  mode?: "create" | "edit";
  requireZone?: boolean;
  readOnly?: boolean;
  onChange: (values: PricingFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PricingForm({
  values,
  selectedZone = null,
  franchiseOptions = [],
  hideFranchise = false,
  mode = "create",
  requireZone = true,
  readOnly = false,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: PricingFormProps) {
  const set = (patch: Partial<PricingFormValues>) =>
    onChange({ ...values, ...patch });

  const canSubmit =
    !readOnly &&
    !isSubmitting &&
    (mode === "edit" ||
      (values.franchise_id &&
        (requireZone
          ? selectedZone && values.zone_name.trim()
          : (values.rule_name?.trim() || values.zone_name.trim()))));

  return (
    <form
      className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      {readOnly && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Consultation seule en API v1 — modification réservée au backoffice admin.
        </p>
      )}

      {!hideFranchise && (
        <div className="block">
          <span className="text-sm font-medium">Franchise</span>
          {mode === "edit" ? (
            <p className="mt-2 rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm font-medium text-foreground">
              {values.franchise_name ??
                franchiseOptions.find(
                  (f) => String(f.id) === String(values.franchise_id)
                )?.name ??
                "Franchise"}
            </p>
          ) : (
            <select
              required
              disabled={readOnly}
              value={values.franchise_id ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                set({ franchise_id: id, zone_id: null, zone_name: "" });
              }}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
            >
              <option value="">Choisir une franchise</option>
              {franchiseOptions.map((f) => (
                <option key={String(f.id)} value={String(f.id)}>
                  {f.name} · {f.city}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {!requireZone && (
        <>
          <label className="block">
            <span className="text-sm font-medium">Nom de la règle</span>
            <input
              required
              disabled={readOnly}
              value={values.rule_name ?? ""}
              onChange={(e) => set({ rule_name: e.target.value })}
              placeholder="Ex. Ride ECO Abidjan MVP"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Catégorie</span>
            <select
              disabled={readOnly}
              value={values.category_code ?? "ECO"}
              onChange={(e) => set({ category_code: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
            >
              {PRICING_CATEGORY_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <div className="block">
        <span className="text-sm font-medium">
          {requireZone ? "Zone" : "Zone (optionnel)"}
        </span>
        {mode === "edit" ? (
          <p className="mt-2 rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm font-medium text-foreground">
            {values.zone_name}
          </p>
        ) : selectedZone ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-teal/30 bg-teal/5 px-3 py-2.5">
            <div>
              <p className="font-medium text-foreground">{selectedZone.name}</p>
              {selectedZone.franchise_name && (
                <p className="text-xs text-muted">{selectedZone.franchise_name}</p>
              )}
            </div>
            <ZoneTypePill type={selectedZone.type} />
          </div>
        ) : requireZone ? (
          <p className="mt-2 rounded-lg border border-dashed border-border bg-canvas px-3 py-4 text-center text-sm text-muted">
            Sélectionnez une zone sur la carte ci-dessus
          </p>
        ) : (
          <p className="mt-2 rounded-lg border border-dashed border-border bg-canvas px-3 py-3 text-sm text-muted">
            Aucune zone liée — la règle s&apos;applique au niveau ville / catégorie.
          </p>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-medium">Service</span>
        <select
          disabled={readOnly}
          value={values.service}
          onChange={(e) =>
            set({ service: e.target.value as PricingRule["service"] })
          }
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
        >
          <option value="taxi">{SERVICE_LABELS.taxi}</option>
          <option value="delivery">{SERVICE_LABELS.delivery}</option>
          <option value="rental">{SERVICE_LABELS.rental}</option>
          <option value="freight">{SERVICE_LABELS.freight}</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Date d&apos;application</span>
        <input
          type="date"
          disabled={readOnly}
          value={values.effectiveFrom ?? ""}
          onChange={(e) => set({ effectiveFrom: e.target.value || undefined })}
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Prise en charge (FCFA)</span>
          <input
            type="number"
            min={1}
            required
            disabled={readOnly}
            value={values.base_fare_fcfa}
            onChange={(e) => set({ base_fare_fcfa: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Par km (FCFA)</span>
          <input
            type="number"
            min={1}
            required
            disabled={readOnly}
            value={values.per_km_fcfa}
            onChange={(e) => set({ per_km_fcfa: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Minimum (FCFA)</span>
          <input
            type="number"
            min={1}
            required
            disabled={readOnly}
            value={values.min_fare_fcfa}
            onChange={(e) => set({ min_fare_fcfa: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Multiplicateur surge (nuit)</span>
          <input
            type="number"
            min={1}
            step={0.05}
            required
            disabled={readOnly}
            value={values.surge_multiplier}
            onChange={(e) => set({ surge_multiplier: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Statut</span>
        <select
          disabled={readOnly}
          value={values.status}
          onChange={(e) =>
            set({ status: e.target.value as PricingRule["status"] })
          }
          className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 disabled:opacity-60"
        >
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
        </select>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? "Retour" : "Annuler"}
        </Button>
        {!readOnly && (
          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting
              ? "Enregistrement…"
              : mode === "edit"
                ? "Enregistrer"
                : "Créer la grille"}
          </Button>
        )}
      </div>
    </form>
  );
}
