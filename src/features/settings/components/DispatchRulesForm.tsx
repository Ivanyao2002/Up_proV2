"use client";

import type {
  DispatchEscalationAction,
  DispatchOfferMode,
  DispatchPriorityMode,
  DispatchRules,
  DispatchServiceType,
  Zone,
} from "@/shared/types";
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

const OFFER_MODE_OPTIONS: { value: DispatchOfferMode; label: string }[] = [
  { value: "sequential", label: "Séquentiel" },
  { value: "broadcast", label: "Broadcast" },
  { value: "batch", label: "Lot (batch)" },
];

const ESCALATION_OPTIONS: { value: DispatchEscalationAction; label: string }[] = [
  { value: "expand_radius", label: "Étendre le rayon" },
  { value: "notify_dispatcher", label: "Notifier le dispatcher" },
  { value: "cancel", label: "Annuler la commande" },
  { value: "surge", label: "Activer le surge" },
];

const SERVICE_TYPES: DispatchServiceType[] = [
  "RIDE",
  "DELIVERY",
  "DELIVERY_CARGO",
  "FREIGHT",
  "RENTAL",
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
  const setNum = (key: keyof DispatchRules, value: number) =>
    set({ [key]: Number.isFinite(value) ? value : 0 } as Partial<DispatchRules>);

  const toggleZone = (zoneId: number | string) => {
    const key = String(zoneId);
    const has = values.active_zone_ids.some((id) => String(id) === key);
    set({
      active_zone_ids: has
        ? values.active_zone_ids.filter((id) => String(id) !== key)
        : [...values.active_zone_ids, zoneId],
    });
  };

  const toggleService = (service: DispatchServiceType) => {
    const has = values.enabled_service_types.includes(service);
    set({
      enabled_service_types: has
        ? values.enabled_service_types.filter((s) => s !== service)
        : [...values.enabled_service_types, service],
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
        <h2 className="text-sm font-semibold text-heading">Vagues et offres</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Rayons vagues (km, séparés par virgule)
            </span>
            <input
              value={values.wave_radii_km.join(", ")}
              onChange={(e) =>
                set({
                  wave_radii_km: e.target.value
                    .split(",")
                    .map((x) => Number(x.trim()))
                    .filter((n) => Number.isFinite(n) && n > 0),
                })
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>
          <NumberField
            label="Intervalle vague (sec)"
            value={values.wave_interval_sec}
            min={1}
            onChange={(v) => setNum("wave_interval_sec", v)}
          />
          <NumberField
            label="TTL offre (sec)"
            value={values.offer_ttl_sec}
            min={1}
            onChange={(v) => setNum("offer_ttl_sec", v)}
          />
          <NumberField
            label="Nombre max de vagues"
            value={values.max_waves}
            min={1}
            onChange={(v) => setNum("max_waves", v)}
          />
          <NumberField
            label="Durée max dispatch (sec)"
            value={values.max_dispatch_duration_sec}
            min={1}
            onChange={(v) => setNum("max_dispatch_duration_sec", v)}
          />
          <NumberField
            label="Offres max par chauffeur"
            value={values.max_offers_per_driver}
            min={1}
            onChange={(v) => setNum("max_offers_per_driver", v)}
          />
          <NumberField
            label="Batch size"
            value={values.batch_size}
            min={1}
            onChange={(v) => setNum("batch_size", v)}
          />
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground">Mode d&apos;offre</span>
          <select
            value={values.offer_mode}
            onChange={(e) => set({ offer_mode: e.target.value as DispatchOfferMode })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            {OFFER_MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-card border border-border bg-surface p-6 space-y-4">
        <h2 className="text-sm font-semibold text-heading">Matching et priorités</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label="Rayon de matching (km)"
            value={values.match_radius_km}
            min={0.1}
            step={0.1}
            onChange={(v) => setNum("match_radius_km", v)}
          />
          <NumberField
            label="Timeout assignation (sec)"
            value={values.assign_timeout_sec}
            min={1}
            onChange={(v) => setNum("assign_timeout_sec", v)}
          />
          <NumberField
            label="Note minimale chauffeur"
            value={values.min_driver_rating}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => setNum("min_driver_rating", v)}
          />
          <NumberField
            label="Courses actives max / chauffeur"
            value={values.max_driver_active_trips}
            min={1}
            onChange={(v) => setNum("max_driver_active_trips", v)}
          />
          <NumberField
            label="Poids distance"
            value={values.distance_weight}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setNum("distance_weight", v)}
          />
          <NumberField
            label="Poids rating"
            value={values.rating_weight}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => setNum("rating_weight", v)}
          />
          <NumberField
            label="Candidats max renvoyés"
            value={values.max_candidates_returned}
            min={1}
            onChange={(v) => setNum("max_candidates_returned", v)}
          />
        </div>

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

        <div className="grid gap-2 md:grid-cols-2">
          <CheckField
            checked={values.require_vehicle_category_match}
            onChange={(checked) => set({ require_vehicle_category_match: checked })}
            label="Exiger correspondance catégorie véhicule"
          />
          <CheckField
            checked={values.require_payment_method_support}
            onChange={(checked) => set({ require_payment_method_support: checked })}
            label="Filtrer sur méthode de paiement acceptée"
          />
          <CheckField
            checked={values.exclude_offline_drivers}
            onChange={(checked) => set({ exclude_offline_drivers: checked })}
            label="Exclure chauffeurs hors ligne"
          />
          <CheckField
            checked={values.exclude_busy_drivers}
            onChange={(checked) => set({ exclude_busy_drivers: checked })}
            label="Exclure chauffeurs occupés"
          />
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-heading">Réassignation et file d&apos;attente</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <NumberField
            label="Taille max file d'attente"
            value={values.max_queue_size}
            min={1}
            onChange={(v) => setNum("max_queue_size", v)}
          />
          <NumberField
            label="Tentatives max réassignation"
            value={values.reassign_max_attempts}
            min={0}
            onChange={(v) => setNum("reassign_max_attempts", v)}
          />
          <NumberField
            label="Délai réassignation (sec)"
            value={values.reassign_delay_sec}
            min={0}
            onChange={(v) => setNum("reassign_delay_sec", v)}
          />
          <NumberField
            label="Cooldown après refus (sec)"
            value={values.rejection_cooldown_sec}
            min={0}
            onChange={(v) => setNum("rejection_cooldown_sec", v)}
          />
          <NumberField
            label="Refus avant cooldown"
            value={values.max_rejections_before_cooldown}
            min={0}
            onChange={(v) => setNum("max_rejections_before_cooldown", v)}
          />
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Action d&apos;escalade</span>
          <select
            value={values.escalation_action}
            onChange={(e) => set({ escalation_action: e.target.value as DispatchEscalationAction })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            {ESCALATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <CheckField
            checked={values.auto_reassign}
            onChange={(checked) => set({ auto_reassign: checked })}
            label="Réassignation automatique"
          />
          <CheckField
            checked={values.cross_zone_assign_allowed}
            onChange={(checked) => set({ cross_zone_assign_allowed: checked })}
            label="Autoriser assignation hors zone"
          />
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-heading">Zones actives et services</h2>
        <p className="mt-1 text-xs text-muted">
          Zones où le dispatch auto est actif + services autorisés.
        </p>
        <div className="mt-4 space-y-2">
          {zones.map((z) => (
            <label
              key={z.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={values.active_zone_ids.some((id) => String(id) === String(z.id))}
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
        <div className="mt-6 grid gap-2 md:grid-cols-3">
          {SERVICE_TYPES.map((service) => (
            <CheckField
              key={service}
              checked={values.enabled_service_types.includes(service)}
              onChange={(_checked) => toggleService(service)}
              label={service}
            />
          ))}
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-6 space-y-4">
        <h2 className="text-sm font-semibold text-heading">Console dispatch</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <NumberField
            label="Intervalle refresh console (sec)"
            value={values.console_poll_interval_sec}
            min={5}
            onChange={(v) => setNum("console_poll_interval_sec", v)}
          />
          <CheckField
            checked={values.shift_required}
            onChange={(checked) => set({ shift_required: checked })}
            label="Exiger un shift actif"
          />
          <CheckField
            checked={values.auto_start_dispatch_on_create}
            onChange={(checked) => set({ auto_start_dispatch_on_create: checked })}
            label="Démarrer dispatch à la création commande"
          />
          <CheckField
            checked={values.manual_dispatch_allowed}
            onChange={(checked) => set({ manual_dispatch_allowed: checked })}
            label="Autoriser dispatch manuel"
          />
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
  if (!values.wave_radii_km.length) {
    errors.push("Définissez au moins un rayon de vague.");
  }
  if (values.wave_radii_km.some((v) => v <= 0)) {
    errors.push("Les rayons de vagues doivent être > 0.");
  }
  if (values.wave_interval_sec <= 0) errors.push("L'intervalle de vague doit être > 0.");
  if (values.offer_ttl_sec <= 0) errors.push("Le TTL des offres doit être > 0.");
  if (values.match_radius_km <= 0) errors.push("Le rayon doit être supérieur à 0.");
  if (values.assign_timeout_sec <= 0) errors.push("Le timeout doit être supérieur à 0.");
  if (values.max_queue_size <= 0) errors.push("La file d'attente doit être supérieure à 0.");
  if (values.distance_weight < 0 || values.rating_weight < 0) {
    errors.push("Les poids distance/rating doivent être positifs.");
  }
  if (Math.abs(values.distance_weight + values.rating_weight - 1) > 0.001) {
    errors.push("Distance weight + rating weight doivent faire 1.");
  }
  if (values.enabled_service_types.length === 0) {
    errors.push("Sélectionnez au moins un service activé.");
  }
  return errors;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
      />
    </label>
  );
}

interface CheckFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function CheckField({ checked, onChange, label }: CheckFieldProps) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-teal"
      />
      {label}
    </label>
  );
}
