import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import type { DriverDetail, Paginated, TripStatus } from "@/shared/types";

export interface DriverTripRow {
  id: string;
  ref: string;
  from_label: string;
  to_label: string;
  status: TripStatus;
  amount_fcfa: number;
  created_at: string;
}

export interface DriverWalletTransaction {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount_fcfa: number;
  balance_after_fcfa: number;
  created_at: string;
}

export const driverDetailService = {
  getById: (id: string | number) =>
    apiClient.get<DriverDetail>(`/admin/drivers/${id}`),

  getTrips: (id: string | number) =>
    apiClient.get<Paginated<DriverTripRow>>(`/admin/drivers/${id}/trips`),

  getWalletTransactions: (id: string | number) =>
    apiClient.get<Paginated<DriverWalletTransaction>>(
      `/admin/drivers/${id}/wallet/transactions`
    ),

  approveKyc: (id: string | number) =>
    apiWithNotify.post(`/admin/drivers/${id}/kyc/approve`, undefined, "KYC approuvé"),

  rejectKyc: (id: string | number, reason: string) =>
    apiWithNotify.post(`/admin/drivers/${id}/kyc/reject`, { reason }, "Document rejeté"),

  suspend: (id: string | number) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/admin/drivers/${id}/suspend`
    ),

  activate: (id: string | number) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/admin/drivers/${id}/activate`
    ),
};
