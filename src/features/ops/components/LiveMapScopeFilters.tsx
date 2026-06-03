"use client";

import type { LiveMapData } from "@/shared/types";

import type { LiveMapScopeFiltersValue } from "../api/liveMap.types";

export type { LiveMapScopeFiltersValue };

interface LiveMapScopeFiltersProps {
  options: NonNullable<LiveMapData["filter_options"]>;
  value: LiveMapScopeFiltersValue;
  onChange: (next: LiveMapScopeFiltersValue) => void;
}

export function LiveMapScopeFilters({
  options,
  value,
  onChange,
}: LiveMapScopeFiltersProps) {
  const isGlobal = value.franchiseId === null && value.partnerId === null;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface px-4 py-3 shadow-card">
      <div className="min-w-[140px] flex-1 sm:max-w-[200px]">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Vue
        </label>
        <select
          value={isGlobal ? "global" : value.franchiseId ?? "global"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "global") {
              onChange({ franchiseId: null, partnerId: null });
              return;
            }
            onChange({
              franchiseId: Number(v),
              partnerId: null,
            });
          }}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
        >
          <option value="global">Mondiale — toutes franchises</option>
          {options.franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.city})
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[160px] flex-1 sm:max-w-[240px]">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Partenaire
        </label>
        <select
          value={value.partnerId ?? ""}
          disabled={options.partners.length === 0}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              onChange({ franchiseId: value.franchiseId, partnerId: null });
              return;
            }
            const partnerId = Number(v);
            const partner = options.partners.find((p) => p.id === partnerId);
            onChange({
              franchiseId: partner?.franchise_id ?? value.franchiseId,
              partnerId,
            });
          }}
          className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2 disabled:opacity-50"
        >
          <option value="">Tous les partenaires</option>
          {options.partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {value.franchiseId === null ? ` · ${p.franchise_name}` : ""}
            </option>
          ))}
        </select>
      </div>

      {!isGlobal && (
        <button
          type="button"
          onClick={() => onChange({ franchiseId: null, partnerId: null })}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
