const compactNumber = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

function currencyLabel(currency: string) {
  return currency === "XOF" ? "FCFA" : currency;
}

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
