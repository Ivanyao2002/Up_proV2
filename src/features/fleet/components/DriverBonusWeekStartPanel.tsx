"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import {
  BONUS_WEEK_START_OPTIONS,
  bonusWeekStartLabel,
  formatCurrentBonusWeekRange,
  isValidBonusWeekStartDow,
  type BonusWeekStartDow,
} from "../lib/bonusWeekStart.labels";
import {
  useDriverBonusSettings,
  useUpdateDriverBonusSettings,
} from "../api/driverBonusSettings.queries";

interface DriverBonusWeekStartPanelProps {
  driverId: string;
  driverName: string;
}

const DEFAULT_WEEK_START: BonusWeekStartDow = 1;

export function DriverBonusWeekStartPanel({
  driverId,
  driverName,
}: DriverBonusWeekStartPanelProps) {
  const { data, isLoading, isError, refetch } = useDriverBonusSettings(driverId);
  const updateSettings = useUpdateDriverBonusSettings(driverId);

  const savedDow = data?.weekStartDow ?? null;
  const [selectedDow, setSelectedDow] = useState<BonusWeekStartDow>(
    savedDow ?? DEFAULT_WEEK_START
  );

  useEffect(() => {
    if (savedDow !== null) {
      setSelectedDow(savedDow);
    }
  }, [savedDow]);

  const isDirty = savedDow === null || selectedDow !== savedDow;
  const weekRangeLabel = useMemo(
    () => formatCurrentBonusWeekRange(selectedDow),
    [selectedDow]
  );

  if (isLoading) {
    return (
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="h-28 animate-pulse rounded bg-navy/10" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 p-6 shadow-card">
        <p className="text-sm text-red-700">
          Impossible de charger les paramètres bonus de ce chauffeur.
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => void refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Jour de début de semaine bonus
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Définit la fenêtre hebdomadaire dans laquelle les courses de{" "}
              <span className="font-medium text-foreground">{driverName}</span>{" "}
              comptent pour les paliers bonus. Seul l&apos;administration peut
              modifier ce paramètre — le chauffeur le consulte en lecture seule
              dans son application.
            </p>
          </div>
          <span className="inline-flex rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal-dark">
            Admin uniquement
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              Jour de début
            </span>
            <select
              value={selectedDow}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                if (isValidBonusWeekStartDow(next)) {
                  setSelectedDow(next);
                }
              }}
              disabled={updateSettings.isPending}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-teal"
            >
              {BONUS_WEEK_START_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-lg border border-border bg-canvas px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Semaine en cours
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {weekRangeLabel}
            </p>
            <p className="mt-1 text-xs text-muted">
              Valeur enregistrée :{" "}
              <span className="font-medium text-foreground">
                {bonusWeekStartLabel(savedDow)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            disabled={!isDirty || updateSettings.isPending}
            onClick={() => updateSettings.mutate(selectedDow)}
          >
            {updateSettings.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {savedDow !== null && selectedDow !== savedDow && (
            <Button
              variant="secondary"
              disabled={updateSettings.isPending}
              onClick={() => setSelectedDow(savedDow)}
            >
              Annuler
            </Button>
          )}
        </div>

        <p className="mt-4 text-xs text-muted">
          API :{" "}
          <code className="rounded bg-navy/5 px-1">
            PUT /v1/admin/drivers/{driverId}/bonus/settings
          </code>
        </p>
      </div>

      <div className="rounded-card border border-dashed border-border bg-surface/60 p-5">
        <h4 className="text-sm font-semibold text-foreground">
          Règles bonus globales
        </h4>
        <p className="mt-1 text-sm text-muted">
          Les paliers (seuils de courses, montants) sont configurés séparément
          dans Finance.
        </p>
        <Link
          href="/admin/finance/bonus-rules"
          className="mt-3 inline-flex text-sm font-medium text-teal hover:text-teal-dark"
        >
          Voir les règles bonus →
        </Link>
      </div>
    </div>
  );
}
