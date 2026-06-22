"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { KpiCard } from "@/shared/ui/KpiCard";
import { SimplePageSkeleton } from "@/shared/ui/skeletons";
import { formatFCFA } from "@/shared/lib/format";
import type {
  PricingCountryCode,
  PricingCountryLayer,
} from "../api/pricingConfig.api.types";
import { buildDefaultPricingCountryLayer } from "../api/pricingConfig.defaults";
import {
  usePatchPricingCountry,
  usePricingConfig,
  useResetPricingCountry,
} from "../api/pricingConfig.queries";
import { isLegacyPricingConfig } from "../api/pricingConfig.service";
import {
  PricingCalibrationEditor,
  PRICING_UEMOA_COUNTRIES,
} from "../components/PricingCalibrationEditor";
import { PricingCalibrationHero } from "../components/PricingCalibrationHero";

const COUNTRY_LABELS: Record<PricingCountryCode, string> = {
  CI: "Côte d'Ivoire",
  SN: "Sénégal",
  BF: "Burkina Faso",
  ML: "Mali",
  GN: "Guinée",
  TG: "Togo",
  BJ: "Bénin",
};

export function PricingCalibrationPage() {
  const legacy = isLegacyPricingConfig();
  const [countryCode, setCountryCode] = useState<PricingCountryCode>("CI");
  const { data, isLoading, isError, refetch } = usePricingConfig(countryCode);
  const patch = usePatchPricingCountry(countryCode);
  const reset = useResetPricingCountry(countryCode);
  const [form, setForm] = useState<PricingCountryLayer | null>(null);

  const effective = data?.effective;

  const heroStats = useMemo(() => {
    const layer =
      effective ??
      data?.document?.countries?.[countryCode] ??
      data?.document?.global ??
      buildDefaultPricingCountryLayer();
    const premiumBand = layer.tripBands?.find((b) => b.id === "intercity");
    return {
      undercut: layer.competitorUndercutPct ?? 20,
      priceCap: layer.priceCapGlobal ?? 2.5,
      bandCount: layer.tripBands?.length ?? 0,
      premiumPrime: premiumBand?.categoryPremiumsXof?.PREMIUM,
      engineEnabled: layer.enabled !== false,
    };
  }, [effective, data, countryCode]);

  useEffect(() => {
    const layer =
      effective ??
      data?.document?.countries?.[countryCode] ??
      data?.document?.global ??
      buildDefaultPricingCountryLayer();
    setForm(structuredClone(layer));
  }, [data, countryCode, effective]);

  if (legacy) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="Calibration moteur de prix"
          breadcrumb={["Admin", "Paramètres", "Tarification", "Calibration"]}
        />
        <EmptyState
          title="Calibration indisponible"
          description="Le moteur de prix par paliers n'est pas activé sur cet environnement. Utilisez les grilles tarifaires classiques en attendant."
          actionLabel="Ouvrir les grilles tarifaires"
          onAction={() => {
            window.location.href = "/admin/settings/pricing";
          }}
        />
      </div>
    );
  }

  if (isLoading || !form) return <SimplePageSkeleton />;

  if (isError) {
    return (
      <div className="animate-fade-up">
        <PageHeader
          title="Calibration moteur de prix"
          breadcrumb={["Admin", "Paramètres", "Tarification", "Calibration"]}
        />
        <EmptyState
          title="Configuration introuvable"
          description="La calibration tarifaire n'a pas pu être chargée pour ce pays. Vérifiez votre connexion puis réessayez."
          actionLabel="Réessayer"
          onAction={() => refetch()}
        />
      </div>
    );
  }

  const clientShare = Math.max(0, 100 - heroStats.undercut);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Calibration moteur de prix"
        breadcrumb={["Admin", "Paramètres", "Tarification", "Calibration"]}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
                Pays
              </span>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value as PricingCountryCode)}
                className="min-h-[42px] rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              >
                {PRICING_UEMOA_COUNTRIES.map((code) => (
                  <option key={code} value={code}>
                    {code} — {COUNTRY_LABELS[code]}
                  </option>
                ))}
              </select>
            </label>
            <Link href="/admin/settings/pricing">
              <Button type="button" variant="secondary">
                Grilles tarifaires
              </Button>
            </Link>
          </div>
        }
      />

      <p className="-mt-2 mb-6 text-sm text-muted">
        Barèmes par distance, primes véhicule, surge et heures de pointe pour{" "}
        <span className="font-medium text-foreground">{COUNTRY_LABELS[countryCode]}</span>.
        Les modifications sont prises en compte en moins d&apos;une minute sur les nouveaux devis.
      </p>

      <div className="animate-stagger space-y-6">
        <PricingCalibrationHero
          countryCode={countryCode}
          countryLabel={COUNTRY_LABELS[countryCode]}
          fromDatabase={data?.fromDatabase}
          undercutPct={heroStats.undercut}
          priceCap={heroStats.priceCap}
          bandCount={heroStats.bandCount}
          premiumPrime={heroStats.premiumPrime}
          engineEnabled={heroStats.engineEnabled}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            index={0}
            label="Part client"
            value={`${clientShare} %`}
            hint={`Décote concurrentielle ${heroStats.undercut} %`}
          />
          <KpiCard
            index={1}
            label="Plafond surge"
            value={`×${heroStats.priceCap}`}
            hint="Limite anti-explosion"
          />
          <KpiCard
            index={2}
            label="Paliers distance"
            value={String(heroStats.bandCount)}
            hint="Hyper-local → inter-villes"
          />
          <KpiCard
            index={3}
            label="Prime Premium"
            value={
              heroStats.premiumPrime != null
                ? formatFCFA(heroStats.premiumPrime)
                : "—"
            }
            hint="Palier inter-villes"
          />
        </div>

        <PricingCalibrationEditor
          countryCode={countryCode}
          values={form}
          onChange={setForm}
          onSave={() => patch.mutate(form)}
          onReset={() => reset.mutate()}
          isSaving={patch.isPending}
          isResetting={reset.isPending}
        />
      </div>
    </div>
  );
}
