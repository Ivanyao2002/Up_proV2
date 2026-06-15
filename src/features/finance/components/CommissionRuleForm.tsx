"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import {
  COMMISSION_REFERENCE,
  formatRatePercent,
  parseRatePercentInput,
  validateFranchisePartnerRates,
} from "@/shared/lib/commissionRateCoupling";
import { useVehicleCategoriesCatalog } from "@/features/fleet/api/vehicles.queries";
import { useFranchisesList } from "@/features/network/api/franchises.queries";
import { usePartnersList } from "@/features/network/api/partners.queries";
import {
  COMMISSION_BASIS_OPTIONS,
  COMMISSION_SCOPE_OPTIONS,
  COMMISSION_SERVICE_TYPE_LABELS,
  COMMISSION_SERVICE_TYPES,
  type CommissionRuleScopeKind,
} from "../api/commissionRules.constants";
import type { CommissionRule } from "../api/commissionRules.mapper";
import {
  emptyCommissionRuleDraft,
  findFranchiseDefaultRule,
  getCommissionRuleScopeKind,
  ruleScopeKey,
  suggestCommissionRuleName,
  validateCommissionRuleForm,
} from "../api/commissionRules.mapper";
import { useSaveCommissionRule } from "../api/commissionRules.queries";
import { CommissionRuleRatesForm } from "./CommissionRuleRatesForm";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2";
const labelClass =
  "text-[10px] font-semibold uppercase tracking-wider text-muted";

export interface CommissionRuleFormProps {
  mode: "create" | "edit";
  rule?: CommissionRule | null;
  allRules: CommissionRule[];
  backHref: string;
  onSuccess: () => void;
}

export function CommissionRuleForm({
  mode,
  rule: ruleProp,
  allRules,
  backHref,
  onSuccess,
}: CommissionRuleFormProps) {
  const isCreate = mode === "create";
  const initialRule = isCreate ? emptyCommissionRuleDraft() : ruleProp!;

  const saveRule = useSaveCommissionRule();
  const { data: franchisesData } = useFranchisesList({ per_page: 200 });
  const { data: categories } = useVehicleCategoriesCatalog();

  const [scopeKind, setScopeKind] = useState<CommissionRuleScopeKind>(
    getCommissionRuleScopeKind(initialRule)
  );
  const [franchiseId, setFranchiseId] = useState(initialRule.franchise_id ?? "");
  const [partnerId, setPartnerId] = useState(initialRule.partner_id ?? "");
  const [cityId, setCityId] = useState(initialRule.city_id ?? "");
  const [serviceType, setServiceType] = useState(initialRule.service_type);
  const [categoryCode, setCategoryCode] = useState(initialRule.category_code);
  const [ruleName, setRuleName] = useState(initialRule.rule_name);
  const [nameTouched, setNameTouched] = useState(!isCreate);
  const [platformRate, setPlatformRate] = useState(initialRule.platform_rate);
  const [driverRate, setDriverRate] = useState(initialRule.driver_rate);
  const [fiscalityRate, setFiscalityRate] = useState(initialRule.fiscality_rate);
  const [partnerRate, setPartnerRate] = useState(initialRule.partner_rate);
  const [franchiseRate, setFranchiseRate] = useState(initialRule.franchise_rate);
  const [priority, setPriority] = useState(initialRule.priority);
  const [active, setActive] = useState(initialRule.active);
  const [basis, setBasis] = useState(initialRule.basis);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const { data: partnersData } = usePartnersList(
    franchiseId ? { franchise_id: franchiseId, per_page: 200 } : undefined
  );

  const isPartnerScoped =
    !isCreate && Boolean(initialRule.partner_id && initialRule.franchise_id);
  const isPartnerCreate = isCreate && scopeKind === "partner";

  const scopeKey = ruleScopeKey({
    service_type: serviceType,
    category_code: categoryCode,
    city_id: cityId.trim() || null,
  });

  const baseFranchiseRule = useMemo(() => {
    if (isCreate) {
      if (scopeKind !== "partner" || !franchiseId.trim()) return null;
      return findFranchiseDefaultRule(allRules, franchiseId.trim(), scopeKey);
    }
    if (!isPartnerScoped) return null;
    return allRules.find(
      (r) =>
        r.franchise_id === initialRule.franchise_id &&
        !r.partner_id &&
        r.service_type === initialRule.service_type &&
        r.category_code === initialRule.category_code &&
        r.city_id === initialRule.city_id
    );
  }, [
    allRules,
    franchiseId,
    initialRule,
    isCreate,
    isPartnerScoped,
    scopeKey,
    scopeKind,
  ]);

  const isPartnerRatesOnly =
    isPartnerScoped || (isPartnerCreate && Boolean(baseFranchiseRule));

  useEffect(() => {
    if (isCreate || !ruleProp) return;
    const next = ruleProp;
    setScopeKind(getCommissionRuleScopeKind(next));
    setFranchiseId(next.franchise_id ?? "");
    setPartnerId(next.partner_id ?? "");
    setCityId(next.city_id ?? "");
    setServiceType(next.service_type);
    setCategoryCode(next.category_code);
    setRuleName(next.rule_name);
    setNameTouched(true);
    setPlatformRate(next.platform_rate);
    setDriverRate(next.driver_rate);
    setFiscalityRate(next.fiscality_rate);
    setPartnerRate(next.partner_rate);
    setFranchiseRate(next.franchise_rate);
    setPriority(next.priority);
    setActive(next.active);
    setBasis(next.basis);
  }, [isCreate, ruleProp]);

  useEffect(() => {
    if (!isCreate || nameTouched) return;
    setRuleName(suggestCommissionRuleName(serviceType, categoryCode));
  }, [categoryCode, isCreate, nameTouched, serviceType]);

  useEffect(() => {
    if (!isCreate || !baseFranchiseRule) return;
    setPlatformRate(baseFranchiseRule.platform_rate);
    setDriverRate(baseFranchiseRule.driver_rate);
    setFiscalityRate(baseFranchiseRule.fiscality_rate);
    setPartnerRate(baseFranchiseRule.partner_rate);
    setFranchiseRate(baseFranchiseRule.franchise_rate);
  }, [baseFranchiseRule, isCreate]);

  useEffect(() => {
    if (scopeKind === "global") {
      setFranchiseId("");
      setPartnerId("");
    } else if (scopeKind === "franchise") {
      setPartnerId("");
    }
  }, [scopeKind]);

  const handlePartnerRateChange = (rate: number) => {
    setPartnerRate(rate);
  };

  const handleFranchiseRateChange = (rate: number) => {
    setFranchiseRate(rate);
  };

  const ratesError = validateFranchisePartnerRates(
    franchiseRate,
    partnerRate,
    platformRate,
    fiscalityRate
  );
  const partnerScopedWithoutBase =
    isPartnerCreate && Boolean(franchiseId.trim()) && !baseFranchiseRule;

  const serviceLabel =
    COMMISSION_SERVICE_TYPE_LABELS[serviceType] ?? serviceType;

  const handleSave = () => {
    const errors = validateCommissionRuleForm({
      ruleName,
      serviceType,
      categoryCode,
      scopeKind: isCreate ? scopeKind : getCommissionRuleScopeKind(initialRule),
      franchiseId: franchiseId.trim() || null,
      partnerId: partnerId.trim() || null,
      poolError: ratesError,
      partnerScopedWithoutBase,
    });
    setFormErrors(errors);
    if (errors.length) return;

    const resolvedFranchiseId =
      scopeKind === "global" ? null : franchiseId.trim() || null;
    const resolvedPartnerId =
      scopeKind === "partner" ? partnerId.trim() || null : null;

    saveRule.mutate(
      {
        id: isCreate ? null : initialRule.id,
        body: {
          franchise_id: isCreate ? resolvedFranchiseId : initialRule.franchise_id,
          partner_id: isCreate ? resolvedPartnerId : initialRule.partner_id,
          city_id: cityId.trim() || null,
          service_type: serviceType,
          category_code: categoryCode,
          rule_name: ruleName.trim(),
          platform_rate: platformRate,
          franchise_rate: franchiseRate,
          partner_rate: partnerRate,
          driver_rate: driverRate,
          fiscality_rate: fiscalityRate,
          platform_fixed_xof: initialRule.platform_fixed_xof,
          franchise_fixed_xof: initialRule.franchise_fixed_xof,
          partner_fixed_xof: initialRule.partner_fixed_xof,
          driver_fixed_xof: initialRule.driver_fixed_xof,
          fiscality_fixed_xof: initialRule.fiscality_fixed_xof,
          basis,
          active,
          priority:
            isPartnerCreate && baseFranchiseRule
              ? Math.max(baseFranchiseRule.priority + 10, 30)
              : priority,
          metadata: isCreate
            ? scopeKind === "partner"
              ? {
                  partner_override: true,
                  base_rule_id: baseFranchiseRule?.id,
                }
              : {}
            : initialRule.metadata,
        },
      },
      { onSuccess }
    );
  };

  return (
    <div className="space-y-6">
      {formErrors.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {isCreate && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-heading">Périmètre</h2>
          <p className="mt-1 text-sm text-muted">
            Globale, franchise ou dérogation partenaire.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMMISSION_SCOPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={saveRule.isPending}
                onClick={() => setScopeKind(option.value)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  scopeKind === option.value
                    ? "bg-teal text-white"
                    : "border border-border bg-canvas text-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-card border border-border bg-surface p-5 shadow-card space-y-4">
        <h2 className="text-sm font-semibold text-heading">Identification</h2>

        {isCreate && scopeKind !== "global" && (
          <label className="block">
            <span className={labelClass}>Franchise</span>
            <select
              value={franchiseId}
              disabled={saveRule.isPending}
              onChange={(e) => {
                setFranchiseId(e.target.value);
                setPartnerId("");
              }}
              className={inputClass}
            >
              <option value="">Sélectionner…</option>
              {(franchisesData?.data ?? []).map((franchise) => (
                <option key={franchise.id} value={String(franchise.id)}>
                  {franchise.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {isCreate && scopeKind === "partner" && (
          <label className="block">
            <span className={labelClass}>Partenaire</span>
            <select
              value={partnerId}
              disabled={saveRule.isPending || !franchiseId}
              onChange={(e) => setPartnerId(e.target.value)}
              className={inputClass}
            >
              <option value="">Sélectionner…</option>
              {(partnersData?.data ?? []).map((partner) => (
                <option key={partner.id} value={String(partner.id)}>
                  {partner.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {isCreate && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Service</span>
              <select
                value={serviceType}
                disabled={saveRule.isPending}
                onChange={(e) => setServiceType(e.target.value)}
                className={inputClass}
              >
                {COMMISSION_SERVICE_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Catégorie</span>
              <select
                value={categoryCode}
                disabled={saveRule.isPending}
                onChange={(e) => setCategoryCode(e.target.value)}
                className={inputClass}
              >
                {(categories ?? []).map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
                {!categories?.some((item) => item.code === categoryCode) && (
                  <option value={categoryCode}>{categoryCode}</option>
                )}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Ville (optionnel)</span>
              <input
                type="text"
                value={cityId}
                disabled={saveRule.isPending}
                onChange={(e) => setCityId(e.target.value)}
                placeholder="ID ville catalogue"
                className={inputClass}
              />
            </label>
          </div>
        )}

        <label className="block">
          <span className={labelClass}>Nom de la règle</span>
          <input
            type="text"
            value={ruleName}
            disabled={saveRule.isPending}
            onChange={(e) => {
              setNameTouched(true);
              setRuleName(e.target.value);
            }}
            className={inputClass}
            placeholder="Commission LIVRAISON MOTO…"
          />
        </label>

        {!isCreate && (
          <div className="grid gap-2 rounded-lg border border-border bg-canvas/40 p-3 text-xs text-muted sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Périmètre :</span>{" "}
              {getCommissionRuleScopeKind(initialRule)}
            </p>
            <p>
              <span className="font-medium text-foreground">Priorité :</span>{" "}
              {priority}
            </p>
            <p>
              <span className="font-medium text-foreground">Service :</span>{" "}
              {serviceLabel}
            </p>
            <p>
              <span className="font-medium text-foreground">Catégorie :</span>{" "}
              {categoryCode}
            </p>
            {cityId ? (
              <p className="sm:col-span-2">
                <span className="font-medium text-foreground">Ville :</span>{" "}
                {cityId}
              </p>
            ) : null}
            <p className="sm:col-span-2">
              <span className="font-medium text-foreground">
                Commission totale (réf. cahier) :
              </span>{" "}
              {formatRatePercent(COMMISSION_REFERENCE.TOTAL)} — fiscalité{" "}
              {formatRatePercent(fiscalityRate)} + franchise{" "}
              {formatRatePercent(franchiseRate)} + partenaire{" "}
              {formatRatePercent(partnerRate)} + plateforme{" "}
              {formatRatePercent(platformRate)}
              {baseFranchiseRule ? (
                <span className="text-muted">
                  {" "}
                  (règle franchise : franchise{" "}
                  {formatRatePercent(baseFranchiseRule.franchise_rate)}, partenaire{" "}
                  {formatRatePercent(baseFranchiseRule.partner_rate)})
                </span>
              ) : null}
            </p>
          </div>
        )}

        {isCreate && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Priorité</span>
              <input
                type="number"
                min={0}
                value={priority}
                disabled={saveRule.isPending || isPartnerCreate}
                onChange={(e) => setPriority(Number(e.target.value) || 0)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Base de calcul</span>
              <select
                value={basis}
                disabled={saveRule.isPending || Boolean(baseFranchiseRule)}
                onChange={(e) => setBasis(e.target.value)}
                className={inputClass}
              >
                {COMMISSION_BASIS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={active}
                disabled={saveRule.isPending}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-teal focus:ring-teal/30"
              />
              <span className="text-sm text-foreground">Règle active</span>
            </label>
          </div>
        )}
      </section>

      {isCreate && !baseFranchiseRule && (
        <section className="rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-sm font-semibold text-heading">
            Taux fixes (plateforme, chauffeur, fiscalité)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <RatePercentInput
              label="Plateforme"
              value={platformRate}
              disabled={saveRule.isPending}
              onChange={setPlatformRate}
            />
            <RatePercentInput
              label="Chauffeur"
              value={driverRate}
              disabled={saveRule.isPending}
              onChange={setDriverRate}
            />
            <RatePercentInput
              label="Fiscalité"
              value={fiscalityRate}
              disabled={saveRule.isPending}
              onChange={setFiscalityRate}
            />
          </div>
        </section>
      )}

      {isCreate && baseFranchiseRule && (
        <p className="text-sm text-muted">
          Taux plateforme, chauffeur et fiscalité repris de la règle franchise «{" "}
          {baseFranchiseRule.rule_name} ».
        </p>
      )}

      {partnerScopedWithoutBase && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Créez d&apos;abord une règle franchise pour ce service et cette catégorie,
          puis ajoutez la dérogation partenaire.
        </p>
      )}

      <section className="rounded-card border border-border bg-surface p-5 shadow-card space-y-4">
        <h2 className="text-sm font-semibold text-heading">
          Parts franchise et partenaire
        </h2>

        {isPartnerRatesOnly ? (
          <p className="text-sm text-muted">
            Règle partenaire — seul le taux partenaire est modifiable (max{" "}
            {formatRatePercent(COMMISSION_REFERENCE.PARTNER_MAX)}). Le taux
            franchise reste celui de la règle franchise (
            {formatRatePercent(franchiseRate)}).
          </p>
        ) : (
          <p className="text-sm text-muted">
            Franchise et partenaire sont des parts indépendantes sur la recette
            brute. La commission totale de{" "}
            {formatRatePercent(COMMISSION_REFERENCE.TOTAL)} inclut aussi
            fiscalité et plateforme.
          </p>
        )}

        <CommissionRuleRatesForm
          platformRate={platformRate}
          driverRate={driverRate}
          fiscalityRate={fiscalityRate}
          franchiseRate={franchiseRate}
          partnerRate={partnerRate}
          franchiseEditable={!isPartnerRatesOnly}
          partnerEditable
          onPartnerRateChange={handlePartnerRateChange}
          onFranchiseRateChange={handleFranchiseRateChange}
          disabled={saveRule.isPending}
        />
      </section>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
        <Link href={backHref}>
          <Button type="button" variant="secondary">
            Annuler
          </Button>
        </Link>
        <Button
          type="button"
          disabled={
            Boolean(ratesError) ||
            saveRule.isPending ||
            !ruleName.trim() ||
            partnerScopedWithoutBase
          }
          onClick={handleSave}
        >
          {saveRule.isPending
            ? "Enregistrement…"
            : isCreate
              ? "Créer la règle"
              : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}

function RatePercentInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (rate: number) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label} (%)</span>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className={inputClass}
        value={(value * 100).toFixed(2)}
        onChange={(e) => {
          const parsed = parseRatePercentInput(e.target.value);
          if (parsed != null) onChange(parsed);
        }}
      />
    </label>
  );
}
