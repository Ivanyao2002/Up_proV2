/** Taux de référence cahier finance §4.1 (% de la recette brute). */
export const COMMISSION_REFERENCE = {
  /** Commission globale UPJUNOO */
  TOTAL: 0.15,
  FISCALITY: 0.023,
  FRANCHISE_MAX: 0.03,
  PARTNER_MAX: 0.04,
  /** Part Centrale UPJUNOO */
  PLATFORM: 0.057,
} as const;

/** Arrondi taux décimal (4 décimales). */
export function roundCommissionRate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function commissionActorsTotal(
  platformRate: number,
  franchiseRate: number,
  partnerRate: number,
  fiscalityRate: number
): number {
  return roundCommissionRate(
    platformRate + franchiseRate + partnerRate + fiscalityRate
  );
}

export function formatRatePercent(rate: number): string {
  return `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")} %`;
}

export function parseRatePercentInput(raw: string): number | null {
  const cleaned = raw.replace("%", "").replace(",", ".").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return roundCommissionRate(n / 100);
}

export function validateFranchiseRate(franchiseRate: number): string | null {
  if (franchiseRate < 0) return "Le taux franchise ne peut pas être négatif.";
  if (franchiseRate > COMMISSION_REFERENCE.FRANCHISE_MAX + 0.0001) {
    return `Le taux franchise ne peut pas dépasser ${formatRatePercent(COMMISSION_REFERENCE.FRANCHISE_MAX)}.`;
  }
  return null;
}

export function validatePartnerRate(partnerRate: number): string | null {
  if (partnerRate < 0) return "Le taux partenaire ne peut pas être négatif.";
  if (partnerRate > COMMISSION_REFERENCE.PARTNER_MAX + 0.0001) {
    return `Le taux partenaire ne peut pas dépasser ${formatRatePercent(COMMISSION_REFERENCE.PARTNER_MAX)}.`;
  }
  return null;
}

export function validateCommissionActorsTotal(
  platformRate: number,
  franchiseRate: number,
  partnerRate: number,
  fiscalityRate: number
): string | null {
  const total = commissionActorsTotal(
    platformRate,
    franchiseRate,
    partnerRate,
    fiscalityRate
  );
  if (Math.abs(total - COMMISSION_REFERENCE.TOTAL) > 0.0002) {
    return `Plateforme + franchise + partenaire + fiscalité = ${formatRatePercent(COMMISSION_REFERENCE.TOTAL)} (actuellement ${formatRatePercent(total)}).`;
  }
  return null;
}

/** Valide franchise et partenaire (plafonds indépendants) + cohérence du total commission. */
export function validateFranchisePartnerRates(
  franchiseRate: number,
  partnerRate: number,
  platformRate: number,
  fiscalityRate: number
): string | null {
  return (
    validateFranchiseRate(franchiseRate) ??
    validatePartnerRate(partnerRate) ??
    validateCommissionActorsTotal(
      platformRate,
      franchiseRate,
      partnerRate,
      fiscalityRate
    )
  );
}
