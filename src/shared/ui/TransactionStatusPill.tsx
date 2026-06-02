import type { TransactionStatus, WithdrawalStatus } from "@/shared/types";

const TX_LABELS: Record<TransactionStatus, string> = {
  completed: "Validé",
  pending: "En attente",
  failed: "Échoué",
};

const TX_STYLES: Record<TransactionStatus, string> = {
  completed: "bg-teal/15 text-teal-dark",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
};

const WD_LABELS: Record<WithdrawalStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const WD_STYLES: Record<WithdrawalStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-teal/15 text-teal-dark",
  rejected: "bg-red-50 text-red-600",
};

export function TransactionStatusPill({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TX_STYLES[status]}`}
    >
      {TX_LABELS[status]}
    </span>
  );
}

export function WithdrawalStatusPill({ status }: { status: WithdrawalStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${WD_STYLES[status]}`}
    >
      {WD_LABELS[status]}
    </span>
  );
}
