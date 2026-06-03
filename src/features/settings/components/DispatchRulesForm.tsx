"use client";

import type { DispatchPriorityMode, DispatchRules, Zone } from "@/shared/types";
import { formatDateTime } from "@/shared/lib/format";
import { Button } from "@/shared/ui/Button";

interface DispatchRulesFormProps {
  zones: Zone[];
  values: DispatchRules;
  onChange: (values: DispatchRules) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errors?: string[];
}

const PRIORITY_OPTIONS: { value: DispatchPriorityMode; label: string }[] = [
  { value: "distance", label: "Proximité" },
  { value: "balanced", label: "Équilibré" },
  { value: "rating", label: "Note chauffeur" },
];

export function DispatchRulesForm({
  zones,
  values,
  onChange,
  onSubmit,
  isSubmitting,
  errors = [],
}: DispatchRulesFormProps) {
  const set = (patch: Partial<DispatchRules>) => onChange({ ...values, ...patch });

  const toggleZone = (zoneId: number) => {
    const has = values.active_zone_ids.includes(zoneId);
    set({
      active_zone_ids: has
        ? values.active_zone_ids.filter((id) => id !== zoneId)
        : [...values.active_zone_ids, zoneId],
    });
  };

  return (
    <form
      className="max-w-5xl space-y-6 justify-center items-center mx-auto"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {errors.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      <section className="rounded-card border border-border bg-surface p-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-foreground">Rayon de matching (km)</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={values.match_radius_km}
            onChange={(e) => set({ match_radius_km: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Timeout assignation (sec)</span>
          <input
            type="number"
            min={1}
            value={values.assign_timeout_sec}
            onChange={(e) => set({ assign_timeout_sec: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Taille max file d&apos;attente</span>
          <input
            type="number"
            min={1}
            value={values.max_queue_size}
            onChange={(e) => set({ max_queue_size: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-foreground">Mode priorité</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {PRIORITY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="priority_mode"
                  checked={values.priority_mode === opt.value}
                  onChange={() => set({ priority_mode: opt.value })}
                  className="text-teal focus:ring-teal"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={values.auto_reassign}
            onChange={(e) => set({ auto_reassign: e.target.checked })}
            className="h-4 w-4 rounded border-border text-teal"
          />
          Réassignation automatique
        </label>
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-heading">Zones actives (surge)</h2>
        <p className="mt-1 text-xs text-muted">
          Zones où le dispatch automatique et le surge s&apos;appliquent
        </p>
        <div className="mt-4 space-y-2">
          {zones.map((z) => (
            <label
              key={z.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={values.active_zone_ids.includes(z.id)}
                onChange={() => toggleZone(z.id)}
                className="h-4 w-4 rounded border-border text-teal"
              />
              <span className="text-sm text-foreground">{z.name}</span>
              {z.surge_multiplier && z.surge_multiplier > 1 && (
                <span className="ml-auto text-xs font-medium text-amber-700">
                  ×{z.surge_multiplier}
                </span>
              )}
            </label>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">
        Dernière modification : {formatDateTime(values.updated_at)}
      </p>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

export function validateDispatchRules(values: DispatchRules): string[] {
  const errors: string[] = [];
  if (values.match_radius_km <= 0) errors.push("Le rayon doit être supérieur à 0.");
  if (values.assign_timeout_sec <= 0) errors.push("Le timeout doit être supérieur à 0.");
  if (values.max_queue_size <= 0) errors.push("La file d'attente doit être supérieure à 0.");
  return errors;
}
