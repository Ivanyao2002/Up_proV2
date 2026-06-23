import type { ApiV1PartnerWalletItem } from "./adminPartnerWallet.api.types";

export interface ApiV1PartnerStats {
  driversCount?: number | null;
  ordersCount?: number | null;
  walletBalanceXof?: number | null;
}

export interface ApiV1PartnerItem {
  id: string;
  franchise_id?: string | null;
  legal_name?: string | null;
  trade_name?: string | null;
  name?: string | null;
  partner_type?: string | null;
  legal_form?: string | null;
  manager_first_name?: string | null;
  manager_last_name?: string | null;
  manager_display_name?: string | null;
  city_id?: string | null;
  address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  commission_rate?: number | null;
  status?: string | null;
  wallet_id?: string | null;
  /** Demande PA-WALLET-01 : objet wallet embarqué (au lieu de wallet_id seul). */
  wallet?: ApiV1PartnerWalletItem | Record<string, unknown> | null;
  stats?: ApiV1PartnerStats | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiV1PartnerDetailResponse {
  status: string;
  generatedAt?: string;
  partner: ApiV1PartnerItem;
}
