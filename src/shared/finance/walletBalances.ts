/** Normalise les soldes portefeuille (2 soldes + pending) depuis des champs API partiels. */

export interface WalletBalances {
  total_fcfa: number;
  withdrawable_fcfa: number;
  non_withdrawable_fcfa: number;
  pending_fcfa?: number;
  /** true si l'API n'expose qu'un solde unique (pas de split explicite). */
  is_legacy_single_balance: boolean;
}

export interface WalletBalancesInput {
  balance_fcfa?: number;
  withdrawable_fcfa?: number | null;
  withdrawable_balance_xof?: number | null;
  non_withdrawable_fcfa?: number | null;
  non_withdrawable_balance_xof?: number | null;
  pending_fcfa?: number;
  pending_withdrawal_fcfa?: number;
  available_fcfa?: number;
}

export function resolveWalletBalances(input: WalletBalancesInput): WalletBalances {
  const balance = Math.max(0, input.balance_fcfa ?? 0);
  const hasExplicitWithdrawable =
    input.withdrawable_fcfa != null || input.withdrawable_balance_xof != null;
  const hasExplicitNonWithdrawable =
    input.non_withdrawable_fcfa != null || input.non_withdrawable_balance_xof != null;

  const withdrawableRaw =
    input.withdrawable_fcfa ??
    input.withdrawable_balance_xof ??
    (hasExplicitNonWithdrawable
      ? Math.max(0, balance - (input.non_withdrawable_fcfa ?? input.non_withdrawable_balance_xof ?? 0))
      : input.available_fcfa ?? balance);

  const nonWithdrawableRaw =
    input.non_withdrawable_fcfa ??
    input.non_withdrawable_balance_xof ??
    (hasExplicitWithdrawable ? Math.max(0, balance - withdrawableRaw) : 0);

  const pending = Math.max(0, input.pending_fcfa ?? input.pending_withdrawal_fcfa ?? 0);
  const total =
    balance > 0 ? balance : Math.max(0, withdrawableRaw) + Math.max(0, nonWithdrawableRaw);

  return {
    total_fcfa: total,
    withdrawable_fcfa: Math.max(0, withdrawableRaw),
    non_withdrawable_fcfa: Math.max(0, nonWithdrawableRaw),
    pending_fcfa: pending > 0 ? pending : undefined,
    is_legacy_single_balance: !hasExplicitWithdrawable && !hasExplicitNonWithdrawable,
  };
}
