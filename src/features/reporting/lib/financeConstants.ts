export const PAYMENT_LABEL: Record<string, string> = {
  cash:         "Espèces",
  wallet:       "Wallet",
  mobile_money: "Mobile Money",
};

export const STATUS_LABEL: Record<string, string> = {
  completed: "Réglées",
  pending:   "En attente",
  failed:    "Échouées",
  refunded:  "Remboursées",
};

export const STATUS_COLOR: Record<string, string> = {
  completed: "text-teal-dark",
  pending:   "text-amber-600",
  failed:    "text-red-600",
  refunded:  "text-muted",
};
