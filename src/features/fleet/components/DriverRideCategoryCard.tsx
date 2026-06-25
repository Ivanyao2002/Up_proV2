"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { ApiError } from "@/core/http/errorHandler";
import { notificationService } from "@/core/http/notificationService";
import { useSetDriverRideCategory } from "../api/driverDetail.queries";
import {
  RIDE_TIER_OPTIONS,
  RIDE_TIERS,
  isRideTierUpgrade,
  normalizeRideTier,
  rideTierLabel,
  type RideTier,
} from "../lib/rideCategory";

/** Détails portés par le `422 DRIVER_CATEGORY_UPGRADE_REQUIRES_FORCE`. */
function extractForceDetails(
  err: unknown
): { vehicleCategory: string; target: string } | null {
  if (!(err instanceof ApiError)) return null;
  if (err.code !== "DRIVER_CATEGORY_UPGRADE_REQUIRES_FORCE") return null;
  // apiClient expose `details = body.error`, dont `details.details = { vehicleCategory, target }`.
  const raw = err.details as
    | {
        vehicleCategory?: string;
        target?: string;
        details?: { vehicleCategory?: string; target?: string };
      }
    | undefined;
  const inner = raw?.details ?? raw;
  return {
    vehicleCategory: inner?.vehicleCategory ?? "—",
    target: inner?.target ?? "",
  };
}

/**
 * Carte « Gamme du chauffeur » (back-office Admin). Permet de changer la gamme
 * (`ride_category_code`). Une montée au-dessus de la catégorie du véhicule
 * déclenche un 422 → on demande confirmation puis on renvoie avec `force: true`.
 * Voir docs/MONTEE-EN-GAMME-CHAUFFEUR.md.
 */
export function DriverRideCategoryCard({
  driverId,
  currentCategory,
}: {
  driverId: string;
  currentCategory: string | null | undefined;
}) {
  const current = normalizeRideTier(currentCategory);
  const initialTier: RideTier = (RIDE_TIERS as readonly string[]).includes(current)
    ? (current as RideTier)
    : "ECO";

  const [selected, setSelected] = useState<RideTier>(initialTier);
  const [forcePrompt, setForcePrompt] = useState<{
    vehicleCategory: string;
    target: string;
  } | null>(null);

  const mutation = useSetDriverRideCategory(driverId);

  const unchanged = selected === current;
  const upgrade = isRideTierUpgrade(current, selected);
  const downgrade = current !== "" && !unchanged && !upgrade;

  const apply = (force: boolean) => {
    mutation.mutate(
      { categoryCode: selected, force },
      {
        onSuccess: () => setForcePrompt(null),
        onError: (err) => {
          const details = extractForceDetails(err);
          if (details) {
            // Montée au-dessus du véhicule : on propose de forcer.
            setForcePrompt({
              vehicleCategory: details.vehicleCategory,
              target: details.target || selected,
            });
            return;
          }
          const message =
            err instanceof Error ? err.message : "Mise à jour de la gamme impossible";
          notificationService.error(message);
        },
      }
    );
  };

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Gamme du chauffeur</h3>
          <p className="mt-1 text-xs text-muted">
            Gamme actuelle :{" "}
            <span className="font-medium text-foreground">
              {rideTierLabel(currentCategory)}
            </span>
          </p>
        </div>
        {upgrade ? (
          <Badge tone="info">Montée en gamme</Badge>
        ) : downgrade ? (
          <Badge tone="neutral">Descente</Badge>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Nouvelle gamme</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value as RideTier)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {RIDE_TIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          onClick={() => apply(false)}
          loading={mutation.isPending}
          disabled={unchanged || mutation.isPending}
          className="sm:w-auto"
        >
          Appliquer
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Une montée au-dessus de la catégorie du véhicule demandera une confirmation.
        Le chauffeur ne peut pas changer sa gamme lui-même.
      </p>

      <ConfirmModal
        open={forcePrompt !== null}
        title="Forcer la montée en gamme ?"
        message={
          forcePrompt
            ? `Le véhicule de ce chauffeur est en gamme ${forcePrompt.vehicleCategory}. Confirmer la montée vers ${forcePrompt.target} ? Le chauffeur recevra des courses de cette gamme même si son véhicule ne correspond pas.`
            : ""
        }
        confirmLabel="Forcer la montée"
        cancelLabel="Annuler"
        onConfirm={() => apply(true)}
        onCancel={() => setForcePrompt(null)}
      />
    </div>
  );
}
