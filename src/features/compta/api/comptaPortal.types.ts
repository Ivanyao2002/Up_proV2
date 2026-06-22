export interface ComptaCountry {
  id: string;
  code: string;
  name: string;
}

export interface ComptaMeAccountant {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  status?: string;
  active?: boolean;
  country?: ComptaCountry;
}

export interface ComptaMeResponse {
  accountant?: ComptaMeAccountant;
  admin?: { userId: string; role: string; allCountries?: boolean };
  country?: ComptaCountry;
}

export interface ComptaDashboardData {
  credits_today_fcfa: number;
  debits_today_fcfa: number;
  commissions_month_fcfa: number;
  withdrawals_pending_count: number;
  withdrawals_pending_fcfa: number;
  reconciliation_open_gaps: number;
  reversals_this_month: number;
  period_label?: string;
  period_status?: string;
  country_name?: string;
}
