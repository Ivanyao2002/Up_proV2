"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { FilterChips } from "@/shared/ui/FilterChips";
import type {
  DispatchCountryPatch,
  DispatchPreset,
  DispatchServiceKey,
  DispatchServiceLayer,
} from "../api/dispatchConfig.api.types";
import {
  DISPATCH_FIELD_HELP,
  DISPATCH_PRESET_OPTIONS,
  DISPATCH_ROUTING_OPTIONS,
  DISPATCH_TAB_HELP,
} from "../api/dispatchConfig.help";
import { DispatchZoneProfilesTable } from "./DispatchZoneProfilesTable";

type TabId = keyof typeof DISPATCH_TAB_HELP;

const TAB_OPTIONS: { value: TabId; label: string }[] = [
  { value: "general", label: "Général" },
  { value: "waves", label: "Vagues" },
  { value: "routing", label: "Routage & score" },
  { value: "offers", label: "Offres" },
  { value: "fairness", label: "Équité" },
  { value: "urgency", label: "Urgence" },
  { value: "traffic", label: "Trafic" },
  { value: "advanced", label: "Avancé" },
];

const SERVICE_OPTIONS: { value: DispatchServiceKey; label: string }[] = [
  { value: "RIDE", label: "Courses VTC" },
  { value: "DELIVERY_CARGO", label: "Livraison" },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2";

function Field({
  label,
  help,
  unit,
  children,
}: {
  label: string;
  help?: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {unit ? (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {unit}
          </span>
        ) : null}
      </span>
      {help ? <p className="mt-0.5 text-xs text-muted">{help}</p> : null}
      {children}
    </label>
  );
}

function CheckField({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-canvas/50 px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-teal focus:ring-teal/30"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {help ? <span className="mt-0.5 block text-xs text-muted">{help}</span> : null}
      </span>
    </label>
  );
}

function NumInput({
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputClass}
    />
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="text-sm font-semibold text-heading">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export interface DispatchCalibrationEditorProps {
  values: DispatchCountryPatch;
  onChange: (next: DispatchCountryPatch) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
  isResetting?: boolean;
}

export function DispatchCalibrationEditor({
  values,
  onChange,
  onSave,
  onReset,
  isSaving,
  isResetting,
}: DispatchCalibrationEditorProps) {
  const [tab, setTab] = useState<TabId>("general");
  const [service, setService] = useState<DispatchServiceKey>("RIDE");
  const f = DISPATCH_FIELD_HELP;

  const layer = values[service] ?? {};
  const setLayer = (patch: Partial<DispatchServiceLayer>) =>
    onChange({ ...values, [service]: { ...layer, ...patch } });
  const setStrategies = (patch: NonNullable<DispatchServiceLayer["strategies"]>) =>
    setLayer({ strategies: { ...layer.strategies, ...patch } });
  const setTraffic = (patch: NonNullable<DispatchServiceLayer["strategies"]>["traffic"]) =>
    setStrategies({ traffic: { ...layer.strategies?.traffic, ...patch } });

  return (
    <div className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card">
      <div>
        <h2 className="text-sm font-semibold text-heading">Paramètres détaillés</h2>
        <p className="mt-1 text-sm text-muted">
          Calibrez séparément les courses et la livraison. Enregistrez pour propager en moins
          d&apos;une minute.
        </p>
      </div>

      <FilterChips options={SERVICE_OPTIONS} value={service} onChange={setService} />
      <FilterChips options={TAB_OPTIONS} value={tab} onChange={setTab} />
      <p className="text-sm text-muted">{DISPATCH_TAB_HELP[tab].subtitle}</p>

      {tab === "general" && (
        <Section title={DISPATCH_TAB_HELP.general.title}>
          <Field label={f.preset.label} help={f.preset.help}>
            <select
              value={layer.strategies?.preset ?? "full"}
              onChange={(e) =>
                setStrategies({ preset: e.target.value as DispatchPreset })
              }
              className={inputClass}
            >
              {DISPATCH_PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.help}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label={f.maxRadiusKm.label} help={f.maxRadiusKm.help} unit={f.maxRadiusKm.unit}>
              <NumInput value={layer.maxRadiusKm} onChange={(v) => setLayer({ maxRadiusKm: v })} step={0.5} />
            </Field>
            <Field label={f.candidateLimit.label} help={f.candidateLimit.help}>
              <NumInput value={layer.candidateLimit} onChange={(v) => setLayer({ candidateLimit: v })} min={1} />
            </Field>
            <Field label={f.driverSearchLimit.label} help={f.driverSearchLimit.help}>
              <NumInput value={layer.driverSearchLimit} onChange={(v) => setLayer({ driverSearchLimit: v })} min={1} max={5000} />
            </Field>
            <Field label={f.minDriverWalletBalanceXof.label} help={f.minDriverWalletBalanceXof.help} unit={f.minDriverWalletBalanceXof.unit}>
              <NumInput value={layer.minDriverWalletBalanceXof} onChange={(v) => setLayer({ minDriverWalletBalanceXof: v })} min={0} />
            </Field>
            <Field label={f.offerTtlSeconds.label} help={f.offerTtlSeconds.help} unit={f.offerTtlSeconds.unit}>
              <NumInput value={layer.offerTtlSeconds} onChange={(v) => setLayer({ offerTtlSeconds: v })} min={1} />
            </Field>
          </div>
        </Section>
      )}

      {tab === "waves" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Vagues</legend>
            {(
              [
                ["radiusIncrementKm", f.radiusIncrementKm],
                ["maxRadiusKmCap", f.maxRadiusKmCap],
                ["maxWaves", f.maxWaves],
                ["waveIntervalSec", f.waveIntervalSec],
                ["globalTimeoutSec", f.globalTimeoutSec],
              ] as const
            ).map(([key, field]) => (
              <Field key={key} label={field.label} help={field.help} unit={"unit" in field ? field.unit : undefined}>
                <NumInput
                  value={layer.wave?.[key]}
                  onChange={(v) => setLayer({ wave: { ...layer.wave, [key]: v } })}
                  min={key === "maxWaves" ? 1 : undefined}
                />
              </Field>
            ))}
          </fieldset>
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Chaînage</legend>
            <Field label={f.tripMaxEtaMinutes.label} help={f.tripMaxEtaMinutes.help} unit={f.tripMaxEtaMinutes.unit}>
              <NumInput value={layer.chain?.tripMaxEtaMinutes} onChange={(v) => setLayer({ chain: { ...layer.chain, tripMaxEtaMinutes: v } })} min={0} />
            </Field>
            <Field label={f.tripMinProgress.label} help={f.tripMinProgress.help}>
              <NumInput value={layer.chain?.tripMinProgress} onChange={(v) => setLayer({ chain: { ...layer.chain, tripMinProgress: v } })} step={0.05} min={0.1} max={1} />
            </Field>
            <Field label={f.chainRadiusBonusKm.label} help={f.chainRadiusBonusKm.help} unit={f.chainRadiusBonusKm.unit}>
              <NumInput value={layer.chain?.radiusBonusKm} onChange={(v) => setLayer({ chain: { ...layer.chain, radiusBonusKm: v } })} min={0} />
            </Field>
            <CheckField
              label={f.emergencyEnabled.label}
              help={f.emergencyEnabled.help}
              checked={layer.chain?.emergencyEnabled !== false}
              onChange={(emergencyEnabled) => setLayer({ chain: { ...layer.chain, emergencyEnabled } })}
            />
          </fieldset>
        </div>
      )}

      {tab === "routing" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Routage">
            <Field label={f.routingMode.label} help={f.routingMode.help}>
              <select
                value={layer.strategies?.routing?.mode ?? "osrm"}
                onChange={(e) =>
                  setStrategies({
                    routing: {
                      ...layer.strategies?.routing,
                      mode: e.target.value as (typeof DISPATCH_ROUTING_OPTIONS)[number],
                    },
                  })
                }
                className={inputClass}
              >
                {DISPATCH_ROUTING_OPTIONS.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={f.maxEtaMinutes.label} help={f.maxEtaMinutes.help} unit={f.maxEtaMinutes.unit}>
              <NumInput
                value={layer.strategies?.routing?.maxEtaMinutes}
                onChange={(v) =>
                  setStrategies({ routing: { ...layer.strategies?.routing, maxEtaMinutes: v } })
                }
                min={0}
              />
            </Field>
            <CheckField
              label="Repli haversine"
              help="Si le routeur échoue, utiliser le vol d'oiseau."
              checked={layer.strategies?.routing?.fallbackToHaversine !== false}
              onChange={(fallbackToHaversine) =>
                setStrategies({ routing: { ...layer.strategies?.routing, fallbackToHaversine } })
              }
            />
          </Section>
          <Section title="Score">
            <Field label={f.scoringMode.label} help={f.scoringMode.help}>
              <select
                value={layer.strategies?.scoring?.mode ?? "dynamic"}
                onChange={(e) =>
                  setStrategies({
                    scoring: {
                      ...layer.strategies?.scoring,
                      mode: e.target.value as "legacy" | "dynamic",
                    },
                  })
                }
                className={inputClass}
              >
                <option value="legacy">Legacy (weights)</option>
                <option value="dynamic">Dynamic</option>
              </select>
            </Field>
            {layer.strategies?.scoring?.mode === "legacy" ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {(["distance", "rating", "reliability"] as const).map((key) => (
                  <Field key={key} label={`Poids ${key}`}>
                    <NumInput
                      value={layer.weights?.[key]}
                      onChange={(v) => setLayer({ weights: { ...layer.weights, [key]: v } })}
                      step={0.05}
                      min={0}
                      max={1}
                    />
                  </Field>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    "proximity",
                    "rating",
                    "reliability",
                    "acceptRate",
                    "idleBonus",
                    "refusalPenalty",
                    "chainPenalty",
                  ] as const
                ).map((key) => (
                  <Field key={key} label={key}>
                    <NumInput
                      value={layer.strategies?.scoring?.dynamic?.[key]}
                      onChange={(v) =>
                        setStrategies({
                          scoring: {
                            ...layer.strategies?.scoring,
                            dynamic: { ...layer.strategies?.scoring?.dynamic, [key]: v },
                          },
                        })
                      }
                      step={0.05}
                      min={0}
                      max={1}
                    />
                  </Field>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {tab === "offers" && (
        <Section title={DISPATCH_TAB_HELP.offers.title}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={f.offerMode.label} help={f.offerMode.help}>
              <select
                value={layer.strategies?.offers?.mode ?? "sequential"}
                onChange={(e) =>
                  setStrategies({
                    offers: {
                      ...layer.strategies?.offers,
                      mode: e.target.value as "sequential" | "batch",
                    },
                  })
                }
                className={inputClass}
              >
                <option value="sequential">Séquentiel (1 à 1)</option>
                <option value="batch">Lot (batch)</option>
              </select>
            </Field>
            <Field label={f.sequentialQueueSize.label} help={f.sequentialQueueSize.help}>
              <NumInput
                value={layer.strategies?.offers?.sequentialQueueSize}
                onChange={(v) =>
                  setStrategies({ offers: { ...layer.strategies?.offers, sequentialQueueSize: v } })
                }
                min={1}
              />
            </Field>
            <Field label={f.batchSize.label} help={f.batchSize.help}>
              <NumInput
                value={layer.strategies?.offers?.batchSize}
                onChange={(v) =>
                  setStrategies({ offers: { ...layer.strategies?.offers, batchSize: v } })
                }
                min={1}
              />
            </Field>
          </div>
          <CheckField
            label={f.autoAssignEnabled.label}
            help={f.autoAssignEnabled.help}
            checked={layer.strategies?.autoAssign?.enabled === true}
            onChange={(enabled) =>
              setStrategies({ autoAssign: { ...layer.strategies?.autoAssign, enabled } })
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={f.minScoreGap.label} help={f.minScoreGap.help}>
              <NumInput
                value={layer.strategies?.autoAssign?.minScoreGap}
                onChange={(v) =>
                  setStrategies({ autoAssign: { ...layer.strategies?.autoAssign, minScoreGap: v } })
                }
                step={0.01}
                min={0}
              />
            </Field>
            <Field label="ETA max auto-assign" unit="min">
              <NumInput
                value={layer.strategies?.autoAssign?.maxEtaMinutes}
                onChange={(v) =>
                  setStrategies({ autoAssign: { ...layer.strategies?.autoAssign, maxEtaMinutes: v } })
                }
                min={1}
              />
            </Field>
          </div>
        </Section>
      )}

      {tab === "fairness" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Équité horaire</legend>
            <CheckField
              label="Équité activée"
              checked={layer.strategies?.fairness?.enabled !== false}
              onChange={(enabled) =>
                setStrategies({ fairness: { ...layer.strategies?.fairness, enabled } })
              }
            />
            <Field label="Courses max / heure">
              <NumInput
                value={layer.strategies?.fairness?.maxAssignmentsPerHour}
                onChange={(v) =>
                  setStrategies({
                    fairness: { ...layer.strategies?.fairness, maxAssignmentsPerHour: v },
                  })
                }
                min={1}
              />
            </Field>
            <Field label="Malus par excédent">
              <NumInput
                value={layer.strategies?.fairness?.penaltyPerExtraAssignment}
                onChange={(v) =>
                  setStrategies({
                    fairness: { ...layer.strategies?.fairness, penaltyPerExtraAssignment: v },
                  })
                }
                step={0.01}
                min={0}
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Pénalités refus</legend>
            <CheckField
              label="Pénalités activées"
              checked={layer.strategies?.penalties?.enabled !== false}
              onChange={(enabled) =>
                setStrategies({ penalties: { ...layer.strategies?.penalties, enabled } })
              }
            />
            <Field label="Réduction score / refus">
              <NumInput
                value={layer.strategies?.penalties?.scoreReductionPerRefusal}
                onChange={(v) =>
                  setStrategies({
                    penalties: { ...layer.strategies?.penalties, scoreReductionPerRefusal: v },
                  })
                }
                step={0.01}
                min={0}
              />
            </Field>
            <Field label="Seuil refus consécutifs">
              <NumInput
                value={layer.strategies?.penalties?.consecutiveRefusalThreshold}
                onChange={(v) =>
                  setStrategies({
                    penalties: {
                      ...layer.strategies?.penalties,
                      consecutiveRefusalThreshold: v,
                    },
                  })
                }
                min={1}
              />
            </Field>
          </fieldset>
        </div>
      )}

      {tab === "urgency" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Urgence">
            <CheckField
              label="Traitement urgent"
              checked={layer.strategies?.urgency?.enabled !== false}
              onChange={(enabled) =>
                setStrategies({ urgency: { ...layer.strategies?.urgency, enabled } })
              }
            />
            <Field label="Intervalle vague urgent" unit="s">
              <NumInput
                value={layer.strategies?.urgency?.waveIntervalSec}
                onChange={(v) =>
                  setStrategies({ urgency: { ...layer.strategies?.urgency, waveIntervalSec: v } })
                }
                min={1}
              />
            </Field>
            <Field label="Bonus rayon urgent" unit="km">
              <NumInput
                value={layer.strategies?.urgency?.radiusBonusKm}
                onChange={(v) =>
                  setStrategies({ urgency: { ...layer.strategies?.urgency, radiusBonusKm: v } })
                }
                min={0}
              />
            </Field>
          </Section>
          <Section title="Courses programmées">
            <CheckField
              label="Dispatch différé"
              help="Démarre le dispatch X minutes avant l'heure prévue."
              checked={layer.strategies?.scheduled?.enabled !== false}
              onChange={(enabled) =>
                setStrategies({ scheduled: { ...layer.strategies?.scheduled, enabled } })
              }
            />
            <Field label="Anticipation" unit="min">
              <NumInput
                value={layer.strategies?.scheduled?.leadTimeMinutes}
                onChange={(v) =>
                  setStrategies({ scheduled: { ...layer.strategies?.scheduled, leadTimeMinutes: v } })
                }
                min={5}
              />
            </Field>
          </Section>
        </div>
      )}

      {tab === "traffic" && (
        <Section
          title={DISPATCH_TAB_HELP.traffic.title}
          description="Le trafic dispatch ajuste l'ETA et le rayon — sans modifier le prix client."
        >
          <CheckField
            label={f.trafficEnabled.label}
            help={f.trafficEnabled.help}
            checked={layer.strategies?.traffic?.enabled !== false}
            onChange={(enabled) => setTraffic({ enabled })}
          />
          <CheckField
            label={f.useZoneProfiles.label}
            help={f.useZoneProfiles.help}
            checked={layer.strategies?.traffic?.useZoneProfiles !== false}
            onChange={(useZoneProfiles) => setTraffic({ useZoneProfiles })}
          />
          <CheckField
            label={f.useLiveTraffic.label}
            help={f.useLiveTraffic.help}
            checked={layer.strategies?.traffic?.useLiveTraffic !== false}
            onChange={(useLiveTraffic) => setTraffic({ useLiveTraffic })}
          />
          <Field label={f.maxEtaMultiplier.label} help={f.maxEtaMultiplier.help} unit={f.maxEtaMultiplier.unit}>
            <NumInput
              value={layer.strategies?.traffic?.maxEtaMultiplier}
              onChange={(v) => setTraffic({ maxEtaMultiplier: v })}
              step={0.05}
              min={1}
            />
          </Field>
          <p className="text-xs text-muted">
            Les jours ouvrables / weekend se règlent via la colonne Jours (0=dim … 6=sam). Les
            jours fériés n&apos;impactent pas le dispatch — uniquement le prix.
          </p>
          <DispatchZoneProfilesTable
            profiles={layer.strategies?.traffic?.zoneProfiles ?? []}
            onChange={(zoneProfiles) => setTraffic({ zoneProfiles })}
          />
        </Section>
      )}

      {tab === "advanced" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Heatmap</legend>
            <CheckField
              label="Heatmap activée"
              checked={layer.strategies?.heatmap?.enabled === true}
              onChange={(enabled) =>
                setStrategies({ heatmap: { ...layer.strategies?.heatmap, enabled } })
              }
            />
            <Field label="Bonus rayon" unit="km">
              <NumInput
                value={layer.strategies?.heatmap?.radiusBonusKm}
                onChange={(v) =>
                  setStrategies({ heatmap: { ...layer.strategies?.heatmap, radiusBonusKm: v } })
                }
                min={0}
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Index GEO</legend>
            <CheckField
              label="Index Redis activé"
              checked={layer.strategies?.geoIndex?.enabled !== false}
              onChange={(enabled) =>
                setStrategies({ geoIndex: { ...layer.strategies?.geoIndex, enabled } })
              }
            />
            <Field label="Clé Redis">
              <input
                value={layer.strategies?.geoIndex?.key ?? "drivers:geo"}
                onChange={(e) =>
                  setStrategies({ geoIndex: { ...layer.strategies?.geoIndex, key: e.target.value } })
                }
                className={inputClass}
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5 lg:col-span-2">
            <legend className="px-1 text-sm font-semibold text-heading">
              Batch matching & repositionnement
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <CheckField
                label="Batch matching"
                checked={layer.strategies?.batchMatching?.enabled === true}
                onChange={(enabled) =>
                  setStrategies({ batchMatching: { ...layer.strategies?.batchMatching, enabled } })
                }
              />
              <CheckField
                label="Repositionnement"
                checked={layer.strategies?.reposition?.enabled === true}
                onChange={(enabled) =>
                  setStrategies({ reposition: { ...layer.strategies?.reposition, enabled } })
                }
              />
            </div>
          </fieldset>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-6">
        <Button type="button" variant="ghost" disabled={isResetting} onClick={onReset}>
          {isResetting ? "Réinitialisation…" : "Réinitialiser les valeurs par défaut"}
        </Button>
        <Button type="button" variant="primary" disabled={isSaving} onClick={onSave}>
          {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
