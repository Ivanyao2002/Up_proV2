import type { Transaction, Withdrawal } from "@/shared/types";

export const TRANSACTION_TYPE_LABELS: Record<Transaction["type"], string> = {
  trip_payment: "Course",
  commission: "Commission",
  withdrawal: "Retrait",
  refund: "Remboursement",
  payout: "Versement",
};

export const WITHDRAWAL_METHOD_LABELS: Record<Withdrawal["method"], string> = {
  orange_money: "Orange Money",
  bank_transfer: "Virement bancaire",
  wallet: "Portefeuille",
};
