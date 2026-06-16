import type { PartnerWallet } from "@/shared/types";
import type {
  ApiV1PartnerLedgerItem,
  ApiV1PartnerWalletItem,
} from "./adminPartnerWallet.api.types";

function ledgerLabel(item: ApiV1PartnerLedgerItem): string {
  if (item.description?.trim()) return item.description.trim();
  if (item.entry_type?.trim()) return item.entry_type.replace(/_/g, " ");
  return "Mouvement";
}

export function mapApiLedgerItemToMovement(
  item: ApiV1PartnerLedgerItem
): PartnerWallet["recent_movements"][0] {
  const direction =
    String(item.direction ?? "credit").toLowerCase() === "debit"
      ? "debit"
      : "credit";

  return {
    id: item.id,
    label: ledgerLabel(item),
    amount_fcfa: item.amount_xof ?? 0,
    direction,
    created_at:
      item.posted_at ?? item.created_at ?? new Date().toISOString(),
  };
}

export function mapApiPartnerWalletToUi(
  wallet?: ApiV1PartnerWalletItem | null,
  ledgerItems?: ApiV1PartnerLedgerItem[]
): PartnerWallet | undefined {
  if (!wallet?.id) return undefined;

  const balance = wallet.balance_cached_xof ?? 0;
  const pending = wallet.pending_withdrawal_xof ?? 0;
  const withdrawable =
    wallet.withdrawable_balance_xof ?? wallet.withdrawable_xof ?? undefined;
  const nonWithdrawable =
    wallet.non_withdrawable_balance_xof ?? wallet.non_withdrawable_xof ?? undefined;
  const available =
    wallet.available_xof != null
      ? wallet.available_xof
      : Math.max(0, balance - pending);

  return {
    balance_fcfa: balance,
    withdrawable_fcfa: withdrawable,
    non_withdrawable_fcfa: nonWithdrawable,
    pending_withdrawal_fcfa: pending,
    available_fcfa: available,
    recent_movements: (ledgerItems ?? []).map(mapApiLedgerItemToMovement),
  };
}

/** Objet wallet embarqué dans GET /v1/partners/{id} (demande backend PA-WALLET-01). */
export function mapEmbeddedPartnerWalletToUi(
  wallet: Record<string, unknown> | null | undefined,
  ledgerItems?: ApiV1PartnerLedgerItem[]
): PartnerWallet | undefined {
  if (!wallet || typeof wallet !== "object") return undefined;

  const item: ApiV1PartnerWalletItem = {
    id: String(wallet.id ?? ""),
    balance_cached_xof:
      (wallet.balance_cached_xof as number | undefined) ??
      (wallet.balanceXof as number | undefined) ??
      (wallet.balance_fcfa as number | undefined) ??
      null,
    pending_withdrawal_xof:
      (wallet.pending_withdrawal_xof as number | undefined) ??
      (wallet.pendingWithdrawalXof as number | undefined) ??
      null,
    available_xof:
      (wallet.available_xof as number | undefined) ??
      (wallet.availableXof as number | undefined) ??
      null,
  };

  const embeddedMovements = Array.isArray(wallet.recent_movements)
    ? (wallet.recent_movements as PartnerWallet["recent_movements"])
    : Array.isArray(wallet.recentMovements)
      ? (wallet.recentMovements as PartnerWallet["recent_movements"])
      : undefined;

  const mapped = mapApiPartnerWalletToUi(item, ledgerItems);
  if (!mapped) return undefined;
  if (embeddedMovements?.length) {
    mapped.recent_movements = embeddedMovements;
  }
  return mapped;
}
