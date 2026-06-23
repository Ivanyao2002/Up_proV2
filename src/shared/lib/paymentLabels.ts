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

/** Libellé localisé d'un statut de paiement (pending/paid/failed/refunded…). */
export function getPaymentStatusLabel(status?: string | null): string {
  if (!status?.trim()) return "—";
  const key = status.toLowerCase();
  if (key === "pending") return "En attente";
  if (key === "paid" || key === "completed") return "Payé";
  if (key === "failed") return "Échoué";
  if (key === "refunded") return "Remboursé";
  return status;
}
