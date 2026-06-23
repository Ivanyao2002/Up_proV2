import type { TransactionStatus, WithdrawalStatus } from "@/shared/types";
import { Badge, type BadgeTone } from "./Badge";

const TX_MAP: Record<TransactionStatus, { label: string; tone: BadgeTone }> = {
  completed: { label: "Validé", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
  failed: { label: "Échoué", tone: "danger" },
};

const WD_MAP: Record<WithdrawalStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: "En attente", tone: "warning" },
  approved: { label: "Approuvé", tone: "success" },
  rejected: { label: "Rejeté", tone: "danger" },
};

export function TransactionStatusPill({ status }: { status: TransactionStatus }) {
  const { label, tone } = TX_MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function WithdrawalStatusPill({ status }: { status: WithdrawalStatus }) {
  const { label, tone } = WD_MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}
