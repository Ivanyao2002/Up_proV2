"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import type {
  AgentCompensation,
  AgentCompensationType,
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

interface Props {
  compensations: AgentCompensation[];
  readOnly     : boolean;
  isPending    : boolean;
  onApply      : (type: AgentCompensationType, discount_value?: number) => void;
}

export function AgentCompensationsPanel({ compensations, readOnly, isPending, onApply }: Props) {
  const [open, setOpen]   = useState(false);
  const [type, setType]   = useState<AgentCompensationType>("percentage_discount");
  const [value, setValue] = useState("");

  const selected = TYPE_OPTIONS.find((o) => o.value === type)!;
  const numValue = Number(value);
  const valueInvalid =
    selected.needsValue &&
    (!value || numValue <= 0 || (type === "percentage_discount" && numValue > 100));

  function handleSubmit() {
    if (valueInvalid) return;
    onApply(type, selected.needsValue ? numValue : undefined);
    setValue("");
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

      {/* Applied list */}
      {compensations.length === 0 && !open && (
        <p className="mt-3 text-xs text-muted">Aucun geste commercial appliqué.</p>
      )}
      {compensations.length > 0 && (
        <ul className="mt-3 space-y-2">
          {compensations.map((c) => (
            <li key={c.id} className="rounded-lg bg-teal/5 px-3 py-2.5 text-xs">
              <p className="font-medium text-teal-dark">{compensationLabel(c)}</p>
              <p className="mt-1 font-mono tracking-widest text-foreground">{c.promo_code}</p>
              <p className="mt-0.5 text-muted">
                {c.created_by} · {formatDateTime(c.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* Inline form */}
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
                Valeur ({selected.unit})
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
              {type === "percentage_discount" && numValue > 100 && (
                <p className="mt-1 text-xs text-red-500">Maximum 100%</p>
              )}
            </label>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              className="!text-xs"
              onClick={() => { setOpen(false); setValue(""); }}
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
