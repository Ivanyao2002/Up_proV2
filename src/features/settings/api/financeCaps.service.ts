import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";

export interface FinanceCapsConfig {
  driver_withdrawal_daily_cap_xof: number;
  partner_withdrawal_daily_cap_xof: number;
  driver_wallet_dispatch_min_xof: number;
  driver_wallet_low_balance_alert_xof: number;
  updated_at?: string;
}

const DEFAULT_CAPS: FinanceCapsConfig = {
  driver_withdrawal_daily_cap_xof: 10_000,
  partner_withdrawal_daily_cap_xof: 30_000,
  driver_wallet_dispatch_min_xof: 500,
  driver_wallet_low_balance_alert_xof: 1_000,
};

interface ApiFinanceCapsResponse {
  status?: string;
  caps?: Partial<FinanceCapsConfig> & Record<string, unknown>;
  settings?: Partial<FinanceCapsConfig> & Record<string, unknown>;
}

function mapCapsResponse(body: ApiFinanceCapsResponse): FinanceCapsConfig {
  const raw = body.caps ?? body.settings ?? body;
  return {
    driver_withdrawal_daily_cap_xof:
      Number(
        raw.driver_withdrawal_daily_cap_xof ??
          raw.driverWithdrawalDailyCapXof ??
          DEFAULT_CAPS.driver_withdrawal_daily_cap_xof
      ) || DEFAULT_CAPS.driver_withdrawal_daily_cap_xof,
    partner_withdrawal_daily_cap_xof:
      Number(
        raw.partner_withdrawal_daily_cap_xof ??
          raw.partnerWithdrawalDailyCapXof ??
          DEFAULT_CAPS.partner_withdrawal_daily_cap_xof
      ) || DEFAULT_CAPS.partner_withdrawal_daily_cap_xof,
    driver_wallet_dispatch_min_xof:
      Number(
        raw.driver_wallet_dispatch_min_xof ??
          raw.driverWalletDispatchMinXof ??
          DEFAULT_CAPS.driver_wallet_dispatch_min_xof
      ) || DEFAULT_CAPS.driver_wallet_dispatch_min_xof,
    driver_wallet_low_balance_alert_xof:
      Number(
        raw.driver_wallet_low_balance_alert_xof ??
          raw.driverWalletLowBalanceAlertXof ??
          DEFAULT_CAPS.driver_wallet_low_balance_alert_xof
      ) || DEFAULT_CAPS.driver_wallet_low_balance_alert_xof,
    updated_at:
      (raw.updated_at as string | undefined) ??
      (raw.updatedAt as string | undefined),
  };
}

export const financeCapsService = {
  get: async (): Promise<FinanceCapsConfig> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<FinanceCapsConfig>("/admin/settings/finance-caps");
    }
    try {
      const response = await apiClient.get<ApiFinanceCapsResponse>(
        LINKS.admin.v1.financeCaps
      );
      return mapCapsResponse(response);
    } catch {
      return DEFAULT_CAPS;
    }
  },

  update: async (payload: FinanceCapsConfig): Promise<FinanceCapsConfig> => {
    if (useLegacyAdminApi()) {
      return apiClient.put<FinanceCapsConfig>("/admin/settings/finance-caps", payload);
    }
    const response = await apiClient.put<ApiFinanceCapsResponse>(
      LINKS.admin.v1.financeCaps,
      payload
    );
    return mapCapsResponse(response);
  },
};

export { DEFAULT_CAPS as FINANCE_CAPS_DEFAULTS };
