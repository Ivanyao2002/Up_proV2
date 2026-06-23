"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { useFranchisesList } from "@/features/network/api/franchises.queries";
import { usePartnersList } from "@/features/network/api/partners.queries";
import {
  BONUS_FUNDED_BY_OPTIONS,
  BONUS_PAYOUT_OPTIONS,
  BONUS_PERIOD_OPTIONS,
  BONUS_SCOPE_OPTIONS,
  BONUS_SERVICE_TYPES,
  defaultFundedByForScope,
  type BonusApiScope,
} from "../api/bonusRules.constants";
import {
  bonusRuleFormToCreateBody,
  bonusRuleFormToUpdateBody,
  bonusRuleToFormDraft,
  emptyBonusRuleDraft,
  validateBonusRuleForm,
  type BonusRuleFormDraft,
} from "../api/bonusRules.form";
import type { BonusRule, BonusRuleTier } from "../api/bonusRules.types";
import { useSaveBonusRule } from "../api/bonusRules.queries";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2";
const labelClass =
  "text-[10px] font-semibold uppercase tracking-wider text-muted";

export interface BonusRuleFormProps {
  mode: "create" | "edit";
  rule?: BonusRule | null;
  backHref: string;
  onSuccess: () => void;
}

export function BonusRuleForm({
  mode,
  rule,
  backHref,
  onSuccess,
}: BonusRuleFormProps) {
  const isCreate = mode === "create";
  const saveRule = useSaveBonusRule();
  const { data: franchisesData } = useFranchisesList({ per_page: 200 });
  const [draft, setDraft] = useState<BonusRuleFormDraft>(() =>
    isCreate ? emptyBonusRuleDraft() : bonusRuleToFormDraft(rule!)
  );
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { data: partnersData } = usePartnersList(
    draft.scope === "PARTNER" && draft.franchiseId
      ? { franchise_id: draft.franchiseId, per_page: 200 }
      : undefined
  );

  useEffect(() => {
    if (!isCreate && rule) {
      setDraft(bonusRuleToFormDraft(rule));
    }
  }, [isCreate, rule]);

  const updateDraft = (patch: Partial<BonusRuleFormDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateScope = (scope: BonusApiScope) => {
    setDraft((current) => ({
      ...current,
      scope,
      franchiseId: scope === "GLOBAL" ? "" : current.franchiseId,
      partnerId: scope === "PARTNER" ? current.partnerId : "",
      fundedBy: defaultFundedByForScope(scope),
    }));
  };

  const updateTier = (index: number, patch: Partial<BonusRuleTier>) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.map((tier, i) =>
        i === index ? { ...tier, ...patch } : tier
      ),
    }));
  };

  const addTier = () => {
    setDraft((current) => {
      const last = current.tiers.at(-1);
      return {
        ...current,
        tiers: [
          ...current.tiers,
          {
            minTrips: (last?.minTrips ?? 0) + 5,
            rewardXof: (last?.rewardXof ?? 0) + 1000,
          },
        ],
      };
    });
  };

  const removeTier = (index: number) => {
    setDraft((current) => ({
      ...current,
      tiers: current.tiers.filter((_, i) => i !== index),
    }));
  };

  const toggleServiceType = (value: string) => {
    setDraft((current) => {
      const selected = new Set(current.countedServiceTypes);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      return {
        ...current,
        countedServiceTypes: Array.from(selected),
      };
    });
  };

  const handleSubmit = () => {
    const errors = validateBonusRuleForm(draft);
    setFormErrors(errors);
    if (errors.length) return;

    const body = isCreate
      ? bonusRuleFormToCreateBody(draft)
      : bonusRuleFormToUpdateBody(draft);

    saveRule.mutate(
      { id: isCreate ? null : rule!.id, body },
      { onSuccess: () => onSuccess() }
    );
  };

  const franchises = franchisesData?.data ?? [];
  const partners = partnersData?.data ?? [];

  return (
    <div className="space-y-6">
      {formErrors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ul className="list-disc space-y-1 pl-5">
            {formErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Identité</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Libellé</span>
            <input
              value={draft.label}
              onChange={(e) => updateDraft({ label: e.target.value })}
              placeholder="Bonus hebdomadaire performance chauffeurs"
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Périmètre</span>
            <select
              value={draft.scope}
              disabled={!isCreate}
              onChange={(e) => updateScope(e.target.value as BonusApiScope)}
              className={inputClass}
            >
              {BONUS_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {!isCreate && (
              <p className="mt-1 text-xs text-muted">
                Le périmètre n&apos;est pas modifiable après création.
              </p>
            )}
          </label>

          <label>
            <span className={labelClass}>Priorité</span>
            <input
              type="number"
              min={0}
              value={draft.priority}
              onChange={(e) =>
                updateDraft({ priority: Number.parseInt(e.target.value, 10) || 0 })
              }
              className={inputClass}
            />
          </label>

          {draft.scope !== "GLOBAL" && (
            <label className="sm:col-span-2">
              <span className={labelClass}>Franchise</span>
              <select
                value={draft.franchiseId}
                disabled={!isCreate}
                onChange={(e) =>
                  updateDraft({ franchiseId: e.target.value, partnerId: "" })
                }
                className={inputClass}
              >
                <option value="">Sélectionner…</option>
                {franchises.map((franchise) => (
                  <option key={String(franchise.id)} value={String(franchise.id)}>
                    {franchise.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {draft.scope === "PARTNER" && (
            <label className="sm:col-span-2">
              <span className={labelClass}>Partenaire</span>
              <select
                value={draft.partnerId}
                disabled={!isCreate || !draft.franchiseId}
                onChange={(e) => updateDraft({ partnerId: e.target.value })}
                className={inputClass}
              >
                <option value="">Sélectionner…</option>
                {partners.map((partner) => (
                  <option key={String(partner.id)} value={String(partner.id)}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Paramètres</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Période</span>
            <select
              value={draft.period}
              onChange={(e) => updateDraft({ period: e.target.value })}
              className={inputClass}
            >
              {BONUS_PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Mode de paiement</span>
            <select
              value={draft.payoutModel}
              onChange={(e) => updateDraft({ payoutModel: e.target.value })}
              className={inputClass}
            >
              {BONUS_PAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Financement</span>
            <select
              value={draft.fundedBy}
              onChange={(e) => updateDraft({ fundedBy: e.target.value })}
              className={inputClass}
            >
              {BONUS_FUNDED_BY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-end gap-2 pb-2">
            <input
              id="bonus-rule-active"
              type="checkbox"
              checked={draft.active}
              onChange={(e) => updateDraft({ active: e.target.checked })}
              className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
            />
            <span className="text-sm font-medium text-foreground">Règle active</span>
          </label>
        </div>

        <div className="mt-5">
          <span className={labelClass}>Services comptabilisés</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {BONUS_SERVICE_TYPES.map((service) => {
              const checked = draft.countedServiceTypes.includes(service.value);
              return (
                <label
                  key={service.value}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    checked
                      ? "border-teal bg-teal/10 text-teal-dark"
                      : "border-border bg-canvas text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleServiceType(service.value)}
                    className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
                  />
                  {service.label}
                </label>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Paliers</h2>
            <p className="mt-1 text-sm text-muted">
              Définissez les seuils de courses et les récompenses associées.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={addTier}>
            Ajouter un palier
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {draft.tiers.map((tier, index) => (
            <div
              key={`tier-${index}`}
              className="grid gap-3 rounded-lg border border-border bg-canvas p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label>
                <span className={labelClass}>Courses minimum</span>
                <input
                  type="number"
                  min={1}
                  value={tier.minTrips}
                  onChange={(e) =>
                    updateTier(index, {
                      minTrips: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>Récompense (FCFA)</span>
                <input
                  type="number"
                  min={1}
                  step={100}
                  value={tier.rewardXof}
                  onChange={(e) =>
                    updateTier(index, {
                      rewardXof: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className={inputClass}
                />
              </label>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={draft.tiers.length <= 1}
                  onClick={() => removeTier(index)}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 sm:w-auto"
                >
                  Retirer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={saveRule.isPending} onClick={handleSubmit}>
          {saveRule.isPending
            ? "Enregistrement…"
            : isCreate
              ? "Créer la règle"
              : "Enregistrer"}
        </Button>
        <Link
          href={backHref}
          className="inline-flex rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-navy/5"
        >
          Annuler
        </Link>
      </div>
    </div>
  );
}
