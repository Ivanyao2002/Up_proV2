import type { Trip } from "@/shared/types";

export const PAYMENT_LABELS: Record<Trip["payment_method"], string> = {
  cash: "Espèces",
  wallet: "Portefeuille",
  card: "Carte bancaire",
  orange_money: "Orange Money",
};

export function getPaymentLabel(method: Trip["payment_method"]): string {
  return PAYMENT_LABELS[method];
}
