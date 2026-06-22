"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import type {
  AgentCompensation,
  AgentCompensationType,
  ApplyCompensationPayload,
} from "../api/agentTicket.types";

const TYPE_OPTIONS: {
  value: AgentCompensationType;
  label: string;
  description: string;
  needsValue: boolean;
  unit: string;
}[] = [
  {
    value: "percentage_discount",
    label: "Réduction en %",
    description: "Ex : -20% sur la prochaine course ou livraison",
    needsValue: true,
    unit: "%",
  },
  {
    value: "fixed_discount",
    label: "Réduction fixe",
    description: "Ex : -2 000 FCFA sur la prochaine commande",
    needsValue: true,
    unit: "FCFA",
  },
  {
    value: "free_service",
    label: "Service offert",
    description: "Prochain trajet ou livraison entièrement gratuit",
    needsValue: false,
    unit: "",
  },
];

function compensationLabel(c: AgentCompensation): string {
  if (c.type === "percentage_discount")
    return `Réduction ${c.discount_value}% — prochaine commande`;
  if (c.type === "fixed_discount")
    return `Réduction ${c.discount_value?.toLocaleString("fr-FR")} FCFA — prochaine commande`;
  return "Prochain service offert";
}

// Date min = demain
function minExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

interface Props {
  compensations: AgentCompensation[];
  readOnly     : boolean;
  isPending    : boolean;
  onApply      : (payload: ApplyCompensationPayload) => void;
  onCancel     : (compId: string) => void;
  isCancelling : boolean;
}

export function AgentCompensationsPanel({
  compensations,
  readOnly,
  isPending,
  onApply,
  onCancel,
  isCancelling,
}: Props) {
  const [open, setOpen]         = useState(false);
  const [type, setType]         = useState<AgentCompensationType>("percentage_discount");
  const [value, setValue]       = useState("");
  const [expiresAt, setExpires] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const selected    = TYPE_OPTIONS.find((o) => o.value === type)!;
  const numValue    = Number(value);
  const valueInvalid =
    selected.needsValue &&
    (!value || numValue <= 0 || (type === "percentage_discount" && numValue > 100));

  function handleSubmit() {
    if (valueInvalid) return;
    onApply({
      type,
      discount_value: selected.needsValue ? numValue : undefined,
      expires_at: expiresAt || undefined,
    });
    setValue("");
    setExpires("");
    setOpen(false);
  }

  function handleTypeChange(next: AgentCompensationType) {
    setType(next);
    setValue("");
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-heading">Geste commercial</h3>
        {!readOnly && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-teal hover:underline"
          >
            + Appliquer
          </button>
        )}
      </div>

      {/* Liste des gestes appliqués */}
      {compensations.length === 0 && !open && (
        <p className="mt-3 text-xs text-muted">Aucun geste commercial appliqué.</p>
      )}
      {compensations.length > 0 && (
        <ul className="mt-3 space-y-2">
          {compensations.map((c) => {
            const isCancelled = !!c.cancelled_at;
            return (
              <li
                key={c.id}
                className={`rounded-lg px-3 py-2.5 text-xs ${
                  isCancelled ? "bg-canvas opacity-60" : "bg-teal/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`font-medium ${isCancelled ? "line-through text-muted" : "text-teal-dark"}`}>
                      {compensationLabel(c)}
                    </p>
                    <p className="mt-1 font-mono tracking-widest text-foreground">{c.promo_code}</p>
                    {c.expires_at && (
                      <p className={`mt-0.5 ${isCancelled ? "text-muted" : "text-amber-600 dark:text-amber-400"}`}>
                        Expire le {formatDate(c.expires_at)}
                      </p>
                    )}
                    {isCancelled && (
                      <p className="mt-0.5 text-red-500">
                        Annulé le {formatDateTime(c.cancelled_at!)}
                      </p>
                    )}
                    <p className="mt-0.5 text-muted">
                      {c.created_by} · {formatDateTime(c.created_at)}
                    </p>
                  </div>

                  {/* Bouton annuler — uniquement si actif et agent peut agir */}
                  {!readOnly && !isCancelled && (
                    cancelId === c.id ? (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-[11px] text-muted">Confirmer ?</p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setCancelId(null)}
                            className="rounded px-2 py-0.5 text-[11px] text-muted hover:bg-canvas"
                          >
                            Non
                          </button>
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={() => { onCancel(c.id); setCancelId(null); }}
                            className="rounded bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {isCancelling ? "…" : "Oui"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCancelId(c.id)}
                        className="shrink-0 text-[11px] text-muted hover:text-red-500"
                      >
                        Annuler
                      </button>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Formulaire */}
      {open && (
        <div className="mt-4 space-y-3">
          <fieldset>
            <legend className="text-xs font-medium text-foreground">Type de geste</legend>
            <div className="mt-2 space-y-2">
              {TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-canvas px-3 py-2.5 hover:border-teal/40"
                >
                  <input
                    type="radio"
                    name="comp_type"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => handleTypeChange(opt.value)}
                    className="mt-0.5 accent-teal"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="block text-xs text-muted">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {selected.needsValue && (
            <label className="block">
              <span className="text-xs font-medium text-foreground">
                Valeur ({selected.unit}) <span className="text-red-500">*</span>
              </span>
              <div className="relative mt-1">
                <input
                  type="number"
                  min={1}
                  max={type === "percentage_discount" ? 100 : undefined}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "percentage_discount" ? "ex. 20" : "ex. 2000"}
                  className="w-full rounded-lg border border-border bg-canvas px-3 py-2 pr-14 text-sm outline-none ring-teal/30 focus:ring-2"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  {selected.unit}
                </span>
              </div>
              {!value && (
                <p className="mt-1 text-xs text-amber-500">Valeur obligatoire</p>
              )}
              {type === "percentage_discount" && numValue > 100 && (
                <p className="mt-1 text-xs text-red-500">Maximum 100%</p>
              )}
            </label>
          )}

          {/* Date limite */}
          <label className="block">
            <span className="text-xs font-medium text-foreground">
              Date limite d'utilisation <span className="text-muted">(optionnel)</span>
            </span>
            <input
              type="date"
              min={minExpiryDate()}
              value={expiresAt}
              onChange={(e) => setExpires(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
            />
            {expiresAt && (
              <p className="mt-1 text-xs text-muted">
                Le code expirera le {formatDate(expiresAt)}.
              </p>
            )}
          </label>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="!text-xs"
              onClick={() => { setOpen(false); setValue(""); setExpires(""); }}
            >
              Annuler
            </Button>
            <Button
              className="!text-xs"
              disabled={isPending || valueInvalid}
              onClick={handleSubmit}
            >
              {isPending ? "Envoi…" : "Confirmer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
