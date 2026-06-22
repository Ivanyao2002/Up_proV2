"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { KpiCard } from "@/shared/ui/KpiCard";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { usePermission } from "@/core/auth/usePermission";
import { PRICING_UEMOA_COUNTRIES } from "../api/pricingConfig.api.types";
import type {
  DispatchCountryCode,
  DispatchCountryPatch,
  DispatchServiceKey,
} from "../api/dispatchConfig.api.types";
import { buildDefaultDispatchServiceLayer } from "../api/dispatchConfig.defaults";
import {
  useDispatchConfig,
  usePatchDispatchCountry,
  useResetDispatchCountry,
} from "../api/dispatchConfig.queries";
import { DispatchCalibrationEditor } from "../components/DispatchCalibrationEditor";
import { DispatchCalibrationHero } from "../components/DispatchCalibrationHero";
import { DispatchCapacityStrip } from "../components/DispatchCapacityStrip";

const COUNTRY_LABELS: Record<DispatchCountryCode, string> = {
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BF: "Burkina Faso",
  ML: "Mali",
  GN: "Guinée",
  TG: "Togo",
  BJ: "Bénin",
};

const SERVICE_LABELS: Record<DispatchServiceKey, string> = {
  RIDE: "Courses VTC",
  DELIVERY_CARGO: "Livraison",
};

export function DispatchRulesPage() {
  const canEdit = usePermission("settings.dispatch_rules.edit");
  const [countryCode, setCountryCode] = useState<DispatchCountryCode>("CI");
  const [heroService, setHeroService] = useState<DispatchServiceKey>("RIDE");
  const { data, isLoading, isError, refetch } = useDispatchConfig(countryCode);
  const patch = usePatchDispatchCountry(countryCode);
  const reset = useResetDispatchCountry(countryCode);
  const [form, setForm] = useState<DispatchCountryPatch | null>(null);

  const effective = data?.effective;

  useEffect(() => {
    if (!effective) return;
    setForm({
      RIDE: structuredClone(effective.RIDE ?? buildDefaultDispatchServiceLayer("RIDE")),
      DELIVERY_CARGO: structuredClone(
        effective.DELIVERY_CARGO ?? buildDefaultDispatchServiceLayer("DELIVERY_CARGO")
      ),
    });
  }, [effective, countryCode]);

  const heroLayer = effective?.[heroService] ?? buildDefaultDispatchServiceLayer(heroService);
  const waveSchedule = data?.waveSchedule?.[heroService] ?? [];

  const kpiRide = useMemo(() => {
    const ride = effective?.RIDE ?? buildDefaultDispatchServiceLayer("RIDE");
    return {
      preset: ride.strategies?.preset ?? "full",
      radius: ride.maxRadiusKm ?? 2,
      ttl: ride.offerTtlSeconds ?? 12,
      waves: ride.wave?.maxWaves ?? 2,
    };
  }, [effective]);

  if (isLoading || !form) return <SimplePageSkeleton />;

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="Calibration dispatch"
          breadcrumb={["Admin", "Paramètres", "Dispatch"]}
        />
        <EmptyState
          title="Configuration introuvable"
          description="La calibration dispatch n'a pas pu être chargée pour ce pays."
          actionLabel="Réessayer"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Calibration dispatch"
        breadcrumb={["Admin", "Paramètres", "Dispatch"]}
        actions={
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
              Pays
            </span>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value as DispatchCountryCode)}
              className="min-h-[42px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            >
              {PRICING_UEMOA_COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {code} — {COUNTRY_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <p className="-mt-2 mb-6 text-sm text-muted">
        Vagues de recherche, scoring et offres pour{" "}
        <span className="font-medium text-foreground">{COUNTRY_LABELS[countryCode]}</span>.
        Les valeurs affichées correspondent à la configuration effective en production.
      </p>

      <div className="animate-stagger space-y-6">
        <div className="flex flex-wrap gap-2">
          {(["RIDE", "DELIVERY_CARGO"] as const).map((svc) => (
            <button
              key={svc}
              type="button"
              onClick={() => setHeroService(svc)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                heroService === svc
                  ? "bg-teal/15 text-teal-dark ring-1 ring-teal/30"
                  : "bg-canvas text-muted ring-1 ring-border hover:bg-surface-hover"
              }`}
            >
              {SERVICE_LABELS[svc]}
            </button>
          ))}
        </div>

        <DispatchCalibrationHero
          countryCode={countryCode}
          countryLabel={COUNTRY_LABELS[countryCode]}
          service={heroService}
          serviceLabel={SERVICE_LABELS[heroService]}
          preset={heroLayer.strategies?.preset ?? "full"}
          maxRadiusKm={heroLayer.maxRadiusKm ?? 2}
          offerTtlSeconds={heroLayer.offerTtlSeconds ?? 12}
          maxWaves={heroLayer.wave?.maxWaves ?? 2}
          waveSchedule={waveSchedule}
        />

        <DispatchCapacityStrip countryCode={countryCode} />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard index={0} label="Preset courses" value={kpiRide.preset} hint="Stratégie RIDE" />
          <KpiCard
            index={1}
            label="Rayon vague 1"
            value={`${kpiRide.radius} km`}
            hint="Recherche initiale"
          />
          <KpiCard
            index={2}
            label="Délai offre"
            value={`${kpiRide.ttl} s`}
            hint="Acceptation chauffeur"
          />
          <KpiCard index={3} label="Vagues max" value={String(kpiRide.waves)} hint="Avant no_driver" />
        </div>

        {canEdit ? (
          <DispatchCalibrationEditor
            values={form}
            onChange={setForm}
            onSave={() => patch.mutate(form)}
            onReset={() => reset.mutate()}
            isSaving={patch.isPending}
            isResetting={reset.isPending}
          />
        ) : (
          <p className="text-sm text-muted">Lecture seule — droits insuffisants.</p>
        )}
      </div>
    </div>
  );
}
