"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { FilterChips } from "@/shared/ui/FilterChips";
import type {
  PricingCountryCode,
  PricingCountryLayer,
  PricingTripBand,
  PricingVehicleCategory,
} from "../api/pricingConfig.api.types";
import {
  PRICING_UEMOA_COUNTRIES,
  PRICING_VEHICLE_CATEGORIES,
} from "../api/pricingConfig.api.types";
import {
  BAND_META,
  CATEGORY_HELP,
  COMBINE_MODE_OPTIONS,
  PRICING_FIELD_HELP,
  PRICING_TAB_HELP,
  TRAFFIC_LEVEL_HELP,
  WEATHER_LEVEL_HELP,
} from "../api/pricingConfig.help";
import { PeakProfilesTable } from "./PeakProfilesTable";
import { PricingHolidaysPanel } from "./PricingHolidaysPanel";

type TabId = keyof typeof PRICING_TAB_HELP;

const TAB_OPTIONS: { value: TabId; label: string }[] = [
  { value: "general", label: "Général" },
  { value: "zones", label: "Zones" },
  { value: "bands", label: "Paliers & catégories" },
  { value: "multipliers", label: "Trafic & météo" },
  { value: "surge", label: "Surge" },
  { value: "traffic", label: "Heures de pointe" },
  { value: "holidays", label: "Jours fériés" },
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
      {help ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{help}</p> : null}
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
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
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

function updateBand(
  bands: PricingTripBand[],
  index: number,
  patch: Partial<PricingTripBand>
): PricingTripBand[] {
  return bands.map((b, i) => (i === index ? { ...b, ...patch } : b));
}

function updateBandTariff(
  bands: PricingTripBand[],
  index: number,
  key: keyof PricingTripBand["tariffs"],
  value: number
): PricingTripBand[] {
  return bands.map((b, i) =>
    i === index ? { ...b, tariffs: { ...b.tariffs, [key]: value } } : b
  );
}

function updateBandPremium(
  bands: PricingTripBand[],
  index: number,
  category: PricingVehicleCategory,
  value: number
): PricingTripBand[] {
  return bands.map((b, i) =>
    i === index
      ? {
          ...b,
          categoryPremiumsXof: { ...b.categoryPremiumsXof, [category]: value },
        }
      : b
  );
}

export interface PricingCalibrationEditorProps {
  countryCode: PricingCountryCode;
  values: PricingCountryLayer;
  onChange: (next: PricingCountryLayer) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
  isResetting?: boolean;
}

export function PricingCalibrationEditor({
  countryCode,
  values,
  onChange,
  onSave,
  onReset,
  isSaving,
  isResetting,
}: PricingCalibrationEditorProps) {
  const [tab, setTab] = useState<TabId>("general");
  const set = (patch: Partial<PricingCountryLayer>) => onChange({ ...values, ...patch });
  const bands = values.tripBands ?? [];
  const f = PRICING_FIELD_HELP;

  return (
    <form
      className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div>
        <h2 className="text-sm font-semibold text-heading">Paramètres détaillés</h2>
        <p className="mt-1 text-sm text-muted">
          Modifiez un bloc puis enregistrez — la mise à jour est effective en moins d&apos;une
          minute.
        </p>
      </div>

      <FilterChips options={TAB_OPTIONS} value={tab} onChange={setTab} />

      <p className="text-sm text-muted">{PRICING_TAB_HELP[tab].subtitle}</p>

      {tab === "general" && (
        <Section title={PRICING_TAB_HELP.general.title}>
          <CheckField
            label={f.enabled.label}
            help={f.enabled.help}
            checked={values.enabled !== false}
            onChange={(enabled) => set({ enabled })}
          />
          <CheckField
            label={f.hybridRoutingEnabled.label}
            help={f.hybridRoutingEnabled.help}
            checked={values.hybridRoutingEnabled !== false}
            onChange={(hybridRoutingEnabled) => set({ hybridRoutingEnabled })}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field
              label={f.competitorUndercutPct.label}
              help={f.competitorUndercutPct.help}
              unit={f.competitorUndercutPct.unit}
            >
              <NumInput
                value={values.competitorUndercutPct}
                onChange={(v) => set({ competitorUndercutPct: v })}
                min={0}
                max={40}
              />
            </Field>
            <Field label={f.roundStepXof.label} help={f.roundStepXof.help} unit={f.roundStepXof.unit}>
              <NumInput
                value={values.roundStepXof}
                onChange={(v) => set({ roundStepXof: v })}
                min={25}
                step={25}
              />
            </Field>
            <Field
              label={f.priceCapGlobal.label}
              help={f.priceCapGlobal.help}
              unit={f.priceCapGlobal.unit}
            >
              <NumInput
                value={values.priceCapGlobal}
                onChange={(v) => set({ priceCapGlobal: v })}
                min={1}
                max={3}
                step={0.1}
              />
            </Field>
            <Field label={f.approachKm.label} help={f.approachKm.help} unit={f.approachKm.unit}>
              <NumInput
                value={values.defaultApproach?.approachKm}
                onChange={(v) =>
                  set({ defaultApproach: { ...values.defaultApproach, approachKm: v } })
                }
                step={0.1}
              />
            </Field>
            <Field label={f.approachMin.label} help={f.approachMin.help} unit={f.approachMin.unit}>
              <NumInput
                value={values.defaultApproach?.approachMin}
                onChange={(v) =>
                  set({ defaultApproach: { ...values.defaultApproach, approachMin: v } })
                }
              />
            </Field>
          </div>
        </Section>
      )}

      {tab === "zones" && (
        <Section title={PRICING_TAB_HELP.zones.title}>
          <CheckField
            label={f.zonePolicyEnabled.label}
            help={f.zonePolicyEnabled.help}
            checked={values.zonePolicy?.enabled !== false}
            onChange={(enabled) => set({ zonePolicy: { ...values.zonePolicy, enabled } })}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label={f.sameZoneMaxDistanceKm.label}
              help={f.sameZoneMaxDistanceKm.help}
              unit={f.sameZoneMaxDistanceKm.unit}
            >
              <NumInput
                value={values.zonePolicy?.sameZoneMaxDistanceKm}
                onChange={(v) =>
                  set({ zonePolicy: { ...values.zonePolicy, sameZoneMaxDistanceKm: v } })
                }
                step={0.5}
              />
            </Field>
            <Field
              label={f.zoneMatchRadiusKm.label}
              help={f.zoneMatchRadiusKm.help}
              unit={f.zoneMatchRadiusKm.unit}
            >
              <NumInput
                value={values.zonePolicy?.zoneMatchRadiusKm}
                onChange={(v) =>
                  set({ zonePolicy: { ...values.zonePolicy, zoneMatchRadiusKm: v } })
                }
                step={0.1}
              />
            </Field>
            <Field
              label={f.hyperLocalMaxDurationMin.label}
              help={f.hyperLocalMaxDurationMin.help}
              unit={f.hyperLocalMaxDurationMin.unit}
            >
              <NumInput
                value={values.zonePolicy?.hyperLocalMaxDurationMin}
                onChange={(v) =>
                  set({ zonePolicy: { ...values.zonePolicy, hyperLocalMaxDurationMin: v } })
                }
              />
            </Field>
          </div>
          <CheckField
            label={f.hyperLocalDurationFallbackEnabled.label}
            help={f.hyperLocalDurationFallbackEnabled.help}
            checked={values.zonePolicy?.hyperLocalDurationFallbackEnabled !== false}
            onChange={(hyperLocalDurationFallbackEnabled) =>
              set({
                zonePolicy: { ...values.zonePolicy, hyperLocalDurationFallbackEnabled },
              })
            }
          />
        </Section>
      )}

      {tab === "bands" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Les quatre paliers sont enregistrés ensemble. L&apos;identifiant{" "}
            <code className="text-xs">intercity</code> désactive le surge sur les longues distances.
          </p>
          {bands.map((band, index) => {
            const meta = BAND_META[band.id];
            return (
              <section
                key={band.id}
                className="rounded-card border border-border border-l-4 border-l-teal bg-surface p-6 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-heading">{band.label}</h3>
                    {meta ? <p className="mt-1 text-xs text-muted">{meta.help}</p> : null}
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {band.id}
                      {band.sameZoneRequired ? " · même zone" : ""}
                    </p>
                  </div>
                  <input
                    value={band.label}
                    onChange={(e) =>
                      onChange({
                        ...values,
                        tripBands: updateBand(bands, index, { label: e.target.value }),
                      })
                    }
                    className="max-w-xs rounded-lg border border-border px-3 py-2 text-sm"
                    aria-label="Libellé du palier"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label={f.minDistanceKm.label}
                    help={f.minDistanceKm.help}
                    unit={f.minDistanceKm.unit}
                  >
                    <NumInput
                      value={band.minDistanceKm ?? undefined}
                      onChange={(v) =>
                        onChange({
                          ...values,
                          tripBands: updateBand(bands, index, { minDistanceKm: v }),
                        })
                      }
                    />
                  </Field>
                  <Field
                    label={f.maxDistanceKm.label}
                    help={f.maxDistanceKm.help}
                    unit={f.maxDistanceKm.unit}
                  >
                    <NumInput
                      value={band.maxDistanceKm ?? undefined}
                      onChange={(v) =>
                        onChange({
                          ...values,
                          tripBands: updateBand(bands, index, { maxDistanceKm: v }),
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Tarifs
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(
                      [
                        ["baseFareXof", f.baseFareXof],
                        ["perKmXof", f.perKmXof],
                        ["perMinuteXof", f.perMinuteXof],
                        ["minimumFareXof", f.minimumFareXof],
                        ["pickupBaseXof", f.pickupBaseXof],
                        ["pickupPerKmXof", f.pickupPerKmXof],
                        ["pickupPerMinuteXof", f.pickupPerMinuteXof],
                      ] as const
                    ).map(([key, field]) => (
                      <Field
                        key={key}
                        label={field.label}
                        help={field.help}
                        unit={field.unit}
                      >
                        <NumInput
                          value={band.tariffs[key]}
                          onChange={(v) =>
                            onChange({
                              ...values,
                              tripBands: updateBandTariff(bands, index, key, v),
                            })
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Primes catégorie
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {PRICING_VEHICLE_CATEGORIES.map((cat) => {
                      const catMeta = CATEGORY_HELP[cat];
                      return (
                        <Field
                          key={cat}
                          label={catMeta.label}
                          help={catMeta.help}
                          unit="XOF"
                        >
                          <NumInput
                            value={
                              band.categoryPremiumsXof?.[cat] ?? (cat === "ECO" ? 0 : undefined)
                            }
                            onChange={(v) =>
                              onChange({
                                ...values,
                                tripBands: updateBandPremium(bands, index, cat, v),
                              })
                            }
                          />
                        </Field>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === "multipliers" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title="Trafic"
            description="Combiné avec la météo, plafonné par le cap global."
          >
            {Object.entries(values.trafficMultipliers ?? {}).map(([key, mult]) => (
              <Field
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                help={TRAFFIC_LEVEL_HELP[key]}
                unit="×"
              >
                <NumInput
                  value={mult}
                  onChange={(v) =>
                    set({ trafficMultipliers: { ...values.trafficMultipliers, [key]: v } })
                  }
                  step={0.05}
                />
              </Field>
            ))}
          </Section>
          <Section title="Météo" description="Résolue sur le point de prise en charge.">
            {Object.entries(values.weatherMultipliers ?? {}).map(([key, mult]) => (
              <Field
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                help={WEATHER_LEVEL_HELP[key]}
                unit="×"
              >
                <NumInput
                  value={mult}
                  onChange={(v) =>
                    set({ weatherMultipliers: { ...values.weatherMultipliers, [key]: v } })
                  }
                  step={0.05}
                />
              </Field>
            ))}
          </Section>
        </div>
      )}

      {tab === "surge" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Zones chaudes</legend>
            <CheckField
              label={f.hotZoneEnabled.label}
              help={f.hotZoneEnabled.help}
              checked={values.hotZonePolicy?.enabled !== false}
              onChange={(enabled) =>
                set({ hotZonePolicy: { ...values.hotZonePolicy, enabled } })
              }
            />
            <Field
              label={f.hotZoneMatchRadiusKm.label}
              help={f.hotZoneMatchRadiusKm.help}
              unit={f.hotZoneMatchRadiusKm.unit}
            >
              <NumInput
                value={values.hotZonePolicy?.zoneMatchRadiusKm}
                onChange={(v) =>
                  set({ hotZonePolicy: { ...values.hotZonePolicy, zoneMatchRadiusKm: v } })
                }
                step={0.1}
              />
            </Field>
            <Field
              label={f.incrementPerHeatLevel.label}
              help={f.incrementPerHeatLevel.help}
              unit={f.incrementPerHeatLevel.unit}
            >
              <NumInput
                value={values.hotZonePolicy?.incrementPerHeatLevel}
                onChange={(v) =>
                  set({ hotZonePolicy: { ...values.hotZonePolicy, incrementPerHeatLevel: v } })
                }
                step={0.05}
              />
            </Field>
            <CheckField
              label={f.useLiveDemandHeat.label}
              help={f.useLiveDemandHeat.help}
              checked={values.hotZonePolicy?.useLiveDemandHeat !== false}
              onChange={(useLiveDemandHeat) =>
                set({ hotZonePolicy: { ...values.hotZonePolicy, useLiveDemandHeat } })
              }
            />
            <Field label={f.combineMode.label} help={f.combineMode.help}>
              <select
                value={values.hotZonePolicy?.combineMode ?? "max"}
                onChange={(e) =>
                  set({
                    hotZonePolicy: {
                      ...values.hotZonePolicy,
                      combineMode: e.target
                        .value as NonNullable<typeof values.hotZonePolicy>["combineMode"],
                    },
                  })
                }
                className={inputClass}
              >
                {COMBINE_MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.help}
                  </option>
                ))}
              </select>
            </Field>
            {Object.entries(values.hotZonePolicy?.heatMultipliers ?? {}).map(([level, mult]) => (
              <Field
                key={level}
                label={`Chaleur niveau ${level}`}
                help={f.heatLevel.help}
                unit={f.heatLevel.unit}
              >
                <NumInput
                  value={mult}
                  onChange={(v) =>
                    set({
                      hotZonePolicy: {
                        ...values.hotZonePolicy,
                        heatMultipliers: {
                          ...values.hotZonePolicy?.heatMultipliers,
                          [level]: v,
                        },
                      },
                    })
                  }
                  step={0.05}
                />
              </Field>
            ))}
            {(values.hotZonePolicy?.liveHeatRatioTiers ?? []).map((tier, i) => (
              <div key={i} className="grid gap-4 sm:grid-cols-2">
                <Field label={`${f.liveHeatMaxRatio.label} (${i + 1})`} help={f.liveHeatMaxRatio.help}>
                  <NumInput
                    value={tier.maxRatio}
                    onChange={(v) => {
                      const tiers = [...(values.hotZonePolicy?.liveHeatRatioTiers ?? [])];
                      tiers[i] = { ...tiers[i], maxRatio: v };
                      set({ hotZonePolicy: { ...values.hotZonePolicy, liveHeatRatioTiers: tiers } });
                    }}
                    step={0.1}
                  />
                </Field>
                <Field label={f.liveHeatLevel.label} help={f.liveHeatLevel.help}>
                  <NumInput
                    value={tier.heatLevel}
                    onChange={(v) => {
                      const tiers = [...(values.hotZonePolicy?.liveHeatRatioTiers ?? [])];
                      tiers[i] = { ...tiers[i], heatLevel: v };
                      set({ hotZonePolicy: { ...values.hotZonePolicy, liveHeatRatioTiers: tiers } });
                    }}
                    min={0}
                    max={5}
                  />
                </Field>
              </div>
            ))}
          </fieldset>

          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">Offre / demande</legend>
            <CheckField
              label={f.supplyDemandEnabled.label}
              help={f.supplyDemandEnabled.help}
              checked={values.supplyDemandPolicy?.enabled !== false}
              onChange={(enabled) =>
                set({ supplyDemandPolicy: { ...values.supplyDemandPolicy, enabled } })
              }
            />
            <Field
              label={f.supplyRadiusKm.label}
              help={f.supplyRadiusKm.help}
              unit={f.supplyRadiusKm.unit}
            >
              <NumInput
                value={values.supplyDemandPolicy?.supplyRadiusKm}
                onChange={(v) =>
                  set({
                    supplyDemandPolicy: { ...values.supplyDemandPolicy, supplyRadiusKm: v },
                  })
                }
              />
            </Field>
            <Field
              label={f.pendingLookbackMin.label}
              help={f.pendingLookbackMin.help}
              unit={f.pendingLookbackMin.unit}
            >
              <NumInput
                value={values.supplyDemandPolicy?.pendingLookbackMin}
                onChange={(v) =>
                  set({
                    supplyDemandPolicy: {
                      ...values.supplyDemandPolicy,
                      pendingLookbackMin: v,
                    },
                  })
                }
              />
            </Field>
            {(values.supplyDemandPolicy?.ratioTiers ?? []).map((tier, i) => (
              <div key={i} className="grid gap-4 sm:grid-cols-2">
                <Field label={`${f.ratioMax.label} (${i + 1})`} help={f.ratioMax.help}>
                  <NumInput
                    value={tier.maxRatio}
                    onChange={(v) => {
                      const tiers = [...(values.supplyDemandPolicy?.ratioTiers ?? [])];
                      tiers[i] = { ...tiers[i], maxRatio: v };
                      set({
                        supplyDemandPolicy: { ...values.supplyDemandPolicy, ratioTiers: tiers },
                      });
                    }}
                    step={0.1}
                  />
                </Field>
                <Field
                  label={f.ratioMultiplier.label}
                  help={f.ratioMultiplier.help}
                  unit={f.ratioMultiplier.unit}
                >
                  <NumInput
                    value={tier.multiplier}
                    onChange={(v) => {
                      const tiers = [...(values.supplyDemandPolicy?.ratioTiers ?? [])];
                      tiers[i] = { ...tiers[i], multiplier: v };
                      set({
                        supplyDemandPolicy: { ...values.supplyDemandPolicy, ratioTiers: tiers },
                      });
                    }}
                    step={0.01}
                  />
                </Field>
              </div>
            ))}
          </fieldset>
        </div>
      )}

      {tab === "traffic" && (
        <Section
          title="Heures de pointe"
          description="Ajustez les profils horaires et les seuils de tension trafic pour ce pays."
        >
          <CheckField
            label={f.trafficPolicyEnabled.label}
            help={f.trafficPolicyEnabled.help}
            checked={values.trafficPolicy?.enabled !== false}
            onChange={(enabled) =>
              set({ trafficPolicy: { ...values.trafficPolicy, enabled } })
            }
          />
          <CheckField
            label={f.autoResolve.label}
            help={f.autoResolve.help}
            checked={values.trafficPolicy?.autoResolve !== false}
            onChange={(autoResolve) =>
              set({ trafficPolicy: { ...values.trafficPolicy, autoResolve } })
            }
          />
          <CheckField
            label={f.inferFromSupplyDemand.label}
            help={f.inferFromSupplyDemand.help}
            checked={values.trafficPolicy?.inferFromSupplyDemand !== false}
            onChange={(inferFromSupplyDemand) =>
              set({ trafficPolicy: { ...values.trafficPolicy, inferFromSupplyDemand } })
            }
          />
          <CheckField
            label={f.urbanBaselineEnabled.label}
            help={f.urbanBaselineEnabled.help}
            checked={values.trafficPolicy?.urbanBaselineEnabled !== false}
            onChange={(urbanBaselineEnabled) =>
              set({ trafficPolicy: { ...values.trafficPolicy, urbanBaselineEnabled } })
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={f.defaultTrafficLevel.label} help={f.defaultTrafficLevel.help}>
              <input
                value={values.trafficPolicy?.defaultTrafficLevel ?? "normal"}
                onChange={(e) =>
                  set({
                    trafficPolicy: {
                      ...values.trafficPolicy,
                      defaultTrafficLevel: e.target.value,
                    },
                  })
                }
                className={inputClass}
              />
            </Field>
            <Field
              label={f.urbanBaselineMinDistanceKm.label}
              help={f.urbanBaselineMinDistanceKm.help}
              unit={f.urbanBaselineMinDistanceKm.unit}
            >
              <NumInput
                value={values.trafficPolicy?.urbanBaselineMinDistanceKm}
                onChange={(v) =>
                  set({
                    trafficPolicy: { ...values.trafficPolicy, urbanBaselineMinDistanceKm: v },
                  })
                }
                step={0.5}
              />
            </Field>
            <Field
              label={f.urbanBaselineDurationMultiplier.label}
              help={f.urbanBaselineDurationMultiplier.help}
              unit={f.urbanBaselineDurationMultiplier.unit}
            >
              <NumInput
                value={values.trafficPolicy?.urbanBaselineDurationMultiplier}
                onChange={(v) =>
                  set({
                    trafficPolicy: {
                      ...values.trafficPolicy,
                      urbanBaselineDurationMultiplier: v,
                    },
                  })
                }
                step={0.05}
              />
            </Field>
            <Field
              label={f.supplyDenseRatioThreshold.label}
              help={f.supplyDenseRatioThreshold.help}
            >
              <NumInput
                value={values.trafficPolicy?.supplyDenseRatioThreshold}
                onChange={(v) =>
                  set({
                    trafficPolicy: { ...values.trafficPolicy, supplyDenseRatioThreshold: v },
                  })
                }
                step={0.1}
              />
            </Field>
            <Field
              label={f.supplyBlockedRatioThreshold.label}
              help={f.supplyBlockedRatioThreshold.help}
            >
              <NumInput
                value={values.trafficPolicy?.supplyBlockedRatioThreshold}
                onChange={(v) =>
                  set({
                    trafficPolicy: {
                      ...values.trafficPolicy,
                      supplyBlockedRatioThreshold: v,
                    },
                  })
                }
                step={0.1}
              />
            </Field>
            <Field
              label={f.maxDurationMultiplier.label}
              help={f.maxDurationMultiplier.help}
              unit={f.maxDurationMultiplier.unit}
            >
              <NumInput
                value={values.trafficPolicy?.maxDurationMultiplier}
                onChange={(v) =>
                  set({
                    trafficPolicy: { ...values.trafficPolicy, maxDurationMultiplier: v },
                  })
                }
                step={0.05}
              />
            </Field>
          </div>

          <PeakProfilesTable
            profiles={values.trafficPolicy?.peakHourProfiles ?? []}
            onChange={(peakHourProfiles) =>
              set({
                trafficPolicy: { ...values.trafficPolicy, peakHourProfiles },
              })
            }
          />
        </Section>
      )}

      {tab === "holidays" && (
        <div className="space-y-6">
          <fieldset className="space-y-4 rounded-card border border-border bg-canvas/30 p-5">
            <legend className="px-1 text-sm font-semibold text-heading">
              Mécanique de majoration
            </legend>
            <CheckField
              label={f.holidayPolicyEnabled.label}
              help={f.holidayPolicyEnabled.help}
              checked={values.holidayPolicy?.enabled !== false}
              onChange={(enabled) =>
                set({ holidayPolicy: { ...values.holidayPolicy, enabled } })
              }
            />
            <CheckField
              label={f.holidayApplyToDelivery.label}
              help={f.holidayApplyToDelivery.help}
              checked={values.holidayPolicy?.applyToDelivery !== false}
              onChange={(applyToDelivery) =>
                set({ holidayPolicy: { ...values.holidayPolicy, applyToDelivery } })
              }
            />
            <Field
              label={f.holidayMaxCoefficient.label}
              help={f.holidayMaxCoefficient.help}
              unit={f.holidayMaxCoefficient.unit}
            >
              <NumInput
                value={values.holidayPolicy?.maxCoefficient}
                onChange={(v) =>
                  set({ holidayPolicy: { ...values.holidayPolicy, maxCoefficient: v } })
                }
                min={1}
                max={3}
                step={0.1}
              />
            </Field>
            <p className="text-xs text-muted">
              Enregistrez les modifications du moteur pour appliquer la mécanique. Le calendrier
              ci-dessous est mis à jour immédiatement.
            </p>
          </fieldset>
          <PricingHolidaysPanel countryCode={countryCode} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-6">
        <Button type="button" variant="ghost" disabled={isResetting} onClick={onReset}>
          {isResetting ? "Réinitialisation…" : "Réinitialiser les valeurs par défaut"}
        </Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </div>
    </form>
  );
}

export { PRICING_UEMOA_COUNTRIES };
