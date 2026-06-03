"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import {
  useCrisisMode,
  useUpdateCrisisMode,
} from "../api/opsExtended.queries";
import type { CrisisModeState } from "../api/opsExtended.service";

const LEVELS: CrisisModeState["level"][] = ["normal", "elevated", "critical"];

const LEVEL_LABELS: Record<CrisisModeState["level"], string> = {
  normal: "Normal",
  elevated: "Élevé",
  critical: "Critique",
};

export function CrisisModePage() {
  const { data, isLoading, isError } = useCrisisMode();
  const update = useUpdateCrisisMode();
  const [draft, setDraft] = useState<CrisisModeState | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  if (isLoading || !draft) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger le mode crise.</p>;
  }

  const set = (patch: Partial<CrisisModeState>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));

  const activateCrisis = () => {
    set({
      active: true,
      level: "elevated",
      pause_dispatch: false,
      global_surge_multiplier: 1.5,
      alert_title: "Alerte UpJunoo",
      alert_message: "Conditions difficiles sur Abidjan — délais possibles.",
    });
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title="Mode crise"
        breadcrumb={["Admin", "Opérations"]}
        actions={
          draft.active ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Crise active
            </span>
          ) : (
            <span className="rounded-full bg-teal/15 px-3 py-1 text-xs font-medium text-teal-dark">
              Opérations normales
            </span>
          )
        }
      />

      {!draft.active && (
        <div className="mb-6 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Le mode crise permet de suspendre le dispatch, activer un surge global et
          afficher une alerte aux utilisateurs.
          <Button variant="secondary" className="mt-3" onClick={activateCrisis}>
            Activer le mode crise (preset)
          </Button>
        </div>
      )}

      <form
        className="space-y-5 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate(draft);
        }}
      >
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => set({ active: e.target.checked })}
            className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
          />
          <span className="text-sm font-medium">Mode crise activé</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Niveau d&apos;alerte</span>
          <select
            value={draft.level}
            onChange={(e) =>
              set({ level: e.target.value as CrisisModeState["level"] })
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={draft.pause_dispatch}
            onChange={(e) => set({ pause_dispatch: e.target.checked })}
            className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
          />
          <span className="text-sm font-medium">Suspendre le dispatch automatique</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Surge global (multiplicateur)</span>
          <input
            type="number"
            min={1}
            max={5}
            step={0.1}
            value={draft.global_surge_multiplier}
            onChange={(e) =>
              set({ global_surge_multiplier: Number(e.target.value) })
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Titre alerte utilisateurs</span>
          <input
            value={draft.alert_title}
            onChange={(e) => set({ alert_title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Message alerte</span>
          <textarea
            rows={3}
            value={draft.alert_message}
            onChange={(e) => set({ alert_message: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <p className="text-xs text-muted">
          Dernière mise à jour : {formatDateTime(draft.updated_at)} · {draft.updated_by}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => data && setDraft(data)}
          >
            Réinitialiser
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
