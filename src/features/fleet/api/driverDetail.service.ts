import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import type { DriverDetail } from "@/shared/types";

export const driverDetailService = {
  getById: (id: string | number) =>
    apiClient.get<DriverDetail>(`/admin/drivers/${id}`),

  approveKyc: (id: string | number) =>
    apiWithNotify.post(`/admin/drivers/${id}/kyc/approve`, undefined, "KYC approuvé"),

  rejectKyc: (id: string | number, reason: string) =>
    apiWithNotify.post(`/admin/drivers/${id}/kyc/reject`, { reason }, "Document rejeté"),
};
