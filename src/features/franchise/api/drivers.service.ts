import { apiClient } from "@/core/http/apiClient";
import type { Driver, DriverDetail, KycQueueItem, Paginated } from "@/shared/types";

export const franchiseDriversService = {
  list: () => apiClient.get<Paginated<Driver>>("/franchise/drivers"),

  kycQueue: () =>
    apiClient.get<Paginated<KycQueueItem>>("/franchise/drivers/kyc-queue"),

  getById: (id: string) => apiClient.get<DriverDetail>(`/franchise/drivers/${id}`),

  approveKyc: (id: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/franchise/drivers/${id}/kyc/approve`
    ),

  rejectKyc: (id: string, reason: string) =>
    apiClient.post<{ ok: boolean; message: string; driver: DriverDetail }>(
      `/franchise/drivers/${id}/kyc/reject`,
      { reason }
    ),

  approveDocument: (driverId: string, docId: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      `/franchise/drivers/${driverId}/documents/${docId}/approve`
    ),

  rejectDocument: (driverId: string, docId: string, reason: string) =>
    apiClient.post<{ ok: boolean; driver: DriverDetail }>(
      `/franchise/drivers/${driverId}/documents/${docId}/reject`,
      { reason }
    ),
};
