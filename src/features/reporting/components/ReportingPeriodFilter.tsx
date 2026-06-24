"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/shared/ui/Button";
import type { ReportingPeriod } from "../api/reporting.types";
import {
  DEFAULT_TIMEZONE,
  PRESETS,
  today,
  formatDateLabel,
  defaultPeriod,
  type Preset,
} from "../lib/periodFilterConstants";

export { defaultPeriod };

interface ReportingPeriodFilterProps {
  value: ReportingPeriod;
  onChange: (period: ReportingPeriod) => void;
  className?: string;
}

export function ReportingPeriodFilter({ value, onChange, className = "" }: ReportingPeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ReportingPeriod>(value);
  const [activePreset, setActivePreset] = useState<string>("month");
  const [showComparison, setShowComparison] = useState(Boolean(value.comparison_date_from));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(value);
    setShowComparison(Boolean(value.comparison_date_from));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function applyPreset(preset: Preset) {
    setActivePreset(preset.key);
    setDraft((d) => ({ ...d, ...preset.getPeriod() }));
  }

  function apply() {
    const final: ReportingPeriod = {
      date_from: draft.date_from,
      date_to: draft.date_to,
      timezone: DEFAULT_TIMEZONE,
    };
    if (showComparison && draft.comparison_date_from && draft.comparison_date_to) {
      final.comparison_date_from = draft.comparison_date_from;
      final.comparison_date_to = draft.comparison_date_to;
    }
    onChange(final);
    setOpen(false);
  }

  function cancel() {
    setDraft(value);
    setShowComparison(Boolean(value.comparison_date_from));
    setOpen(false);
  }

  const periodLabel = `${formatDateLabel(value.date_from)} – ${formatDateLabel(value.date_to)}`;

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm font-medium text-foreground shadow-card transition-colors hover:bg-surface-hover"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 shrink-0 text-teal">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span>{periodLabel}</span>
        <span className="rounded-full bg-border px-1.5 py-0.5 text-[10px] font-medium text-muted">
          UTC+0
        </span>
        {value.comparison_date_from && (
          <span className="rounded-full bg-teal/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-dark">
            vs
          </span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[400px] overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated">
          <div className="h-[3px] bg-teal" />

          <div className="p-5">
            {/* Presets */}
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">Période</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    activePreset === preset.key
                      ? "bg-teal text-white"
                      : "bg-canvas text-muted hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom date range */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Début</label>
                <input
                  type="date"
                  value={draft.date_from}
                  max={draft.date_to}
                  onChange={(e) => {
                    setActivePreset("custom");
                    setDraft((d) => ({ ...d, date_from: e.target.value }));
                  }}
                  className="w-full rounded-lg border border-border bg-[var(--color-input-bg)] px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Fin</label>
                <input
                  type="date"
                  value={draft.date_to}
                  min={draft.date_from}
                  max={today()}
                  onChange={(e) => {
                    setActivePreset("custom");
                    setDraft((d) => ({ ...d, date_to: e.target.value }));
                  }}
                  className="w-full rounded-lg border border-border bg-[var(--color-input-bg)] px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
                />
              </div>
            </div>

            {/* Separator */}
            <div className="mb-4 h-px bg-border" />

            {/* Timezone (read-only) */}
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-canvas px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>Fuseau horaire</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">Africa/Abidjan · UTC+0</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 text-muted">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path strokeLinecap="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            {/* Comparison period */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowComparison((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium text-teal hover:underline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`h-3.5 w-3.5 transition-transform ${showComparison ? "rotate-45" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
                {showComparison ? "Retirer la période de comparaison" : "Ajouter une période de comparaison"}
              </button>

              {showComparison && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Comparaison début</label>
                    <input
                      type="date"
                      value={draft.comparison_date_from ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, comparison_date_from: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-[var(--color-input-bg)] px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Comparaison fin</label>
                    <input
                      type="date"
                      value={draft.comparison_date_to ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, comparison_date_to: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-[var(--color-input-bg)] px-3 py-2 text-sm text-foreground outline-none ring-teal/30 focus:ring-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
              >
                Annuler
              </button>
              <Button type="button" onClick={apply} className="px-5">
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
