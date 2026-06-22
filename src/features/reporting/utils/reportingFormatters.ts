export function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)} %`;
}

// Input is minutes, not seconds.
export function fmtMin(n: number): string {
  if (n < 60) return `${n.toFixed(0)} min`;
  return `${(n / 60).toFixed(1)} h`;
}

// Returns undefined (not "") so callers can pass directly to optional props and skip rendering.
export function formatTrend(pct: number | null): string | undefined {
  if (pct === null) return undefined;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)} %`;
}

// Uses French SI units: o (octet), Ko, Mo — not B/KB/MB.
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

const compactNumber = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

function currencyLabel(currency: string) {
  // XOF is the ISO code for the CFA franc used across West Africa.
  return currency === "XOF" ? "FCFA" : currency;
}

// Thresholds follow West African reporting conventions: k / M / Md (milliard).
export function formatReportingMoney(
  amount: number,
  currency = "XOF"
): string {
  const absoluteAmount = Math.abs(amount);
  const label = currencyLabel(currency);

  if (absoluteAmount >= 1_000_000_000) {
    return `${compactNumber.format(amount / 1_000_000_000)} Md ${label}`;
  }

  if (absoluteAmount >= 1_000_000) {
    return `${compactNumber.format(amount / 1_000_000)} M ${label}`;
  }

  if (absoluteAmount >= 1_000) {
    return `${compactNumber.format(amount / 1_000)} k ${label}`;
  }

  return `${compactNumber.format(amount)} ${label}`;
}
