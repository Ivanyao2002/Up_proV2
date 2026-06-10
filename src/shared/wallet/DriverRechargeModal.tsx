"use client";

import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatFCFA } from "@/shared/lib/format";

export interface DriverRechargeOption {
  id: string;
  label: string;
}

export interface DriverRechargeSubmitPayload {
  driver_ids: string[];
  amount_fcfa: number;
  note?: string;
}

interface DriverRechargeModalProps {
  open: boolean;
  title?: string;
  description?: string;
  availableFcfa: number;
  drivers: DriverRechargeOption[];
  driversLoading?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: DriverRechargeSubmitPayload) => void;
}

export function DriverRechargeModal({
  open,
  title = "Recharger un ou plusieurs chauffeurs",
  description,
  availableFcfa,
  drivers,
  driversLoading = false,
  isSubmitting = false,
  onClose,
  onSubmit,
}: DriverRechargeModalProps) {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [singleDriverId, setSingleDriverId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const parsedAmount = Number(amount.replace(/\s/g, ""));
  const activeIds =
    mode === "single"
      ? singleDriverId
        ? [singleDriverId]
        : []
      : selectedIds;

  const totalDebit = useMemo(
    () => (parsedAmount > 0 ? parsedAmount * activeIds.length : 0),
    [parsedAmount, activeIds.length]
  );

  const valid =
    activeIds.length > 0 &&
    parsedAmount >= 1000 &&
    totalDebit <= availableFcfa;

  if (!open) return null;

  function toggleDriver(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-surface p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-heading">{title}</h2>
        <p className="mt-1 text-sm text-muted">
          {description ??
            `Crédit sur le portefeuille mobile (app chauffeur). Disponible : ${formatFCFA(availableFcfa)}`}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              mode === "single"
                ? "bg-teal text-white"
                : "bg-muted/10 text-muted"
            }`}
          >
            Un chauffeur
          </button>
          <button
            type="button"
            onClick={() => setMode("multi")}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              mode === "multi"
                ? "bg-teal text-white"
                : "bg-muted/10 text-muted"
            }`}
          >
            Plusieurs chauffeurs
          </button>
        </div>

        {mode === "single" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium">Chauffeur</span>
            <select
              value={singleDriverId}
              onChange={(e) => setSingleDriverId(e.target.value)}
              disabled={driversLoading}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            >
              <option value="">Sélectionner…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="mt-4">
            <span className="text-sm font-medium">Chauffeurs</span>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
              {driversLoading ? (
                <p className="text-sm text-muted">Chargement…</p>
              ) : drivers.length === 0 ? (
                <p className="text-sm text-muted">Aucun chauffeur approuvé.</p>
              ) : (
                drivers.map((d) => (
                  <label
                    key={d.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(d.id)}
                      onChange={() => toggleDriver(d.id)}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{d.label}</span>
                  </label>
                ))
              )}
            </div>
            {selectedIds.length > 0 ? (
              <p className="mt-1 text-xs text-muted">
                {selectedIds.length} chauffeur(s) sélectionné(s)
              </p>
            ) : null}
          </div>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            Montant par chauffeur (FCFA)
          </span>
          <input
            type="number"
            min={1000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            placeholder="Ex. 25000"
          />
        </label>

        {activeIds.length > 1 ? (
          <p className="mt-2 text-sm text-muted">
            Total : {formatFCFA(totalDebit)} ({activeIds.length} ×{" "}
            {formatFCFA(parsedAmount || 0)})
          </p>
        ) : null}

        <label className="mt-4 block">
          <span className="text-sm font-medium">Note (optionnel)</span>
          <input
            type="text"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            placeholder="Ex. Prime, avance carburant…"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            disabled={!valid || isSubmitting}
            onClick={() => {
              if (!valid) return;
              onSubmit({
                driver_ids: activeIds,
                amount_fcfa: parsedAmount,
                note: note.trim() || undefined,
              });
            }}
          >
            {isSubmitting
              ? "Transfert…"
              : activeIds.length > 1
                ? `Transférer (${activeIds.length})`
                : "Transférer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
