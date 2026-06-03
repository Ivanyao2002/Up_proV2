import { apiClient } from "@/core/http/apiClient";
import type { TripDetail } from "@/shared/types";

export interface ReassignCandidate {
  id: number;
  name: string;
  vehicle: string;
}

export const tripDetailService = {
  getById: (id: string) => apiClient.get<TripDetail>(`/admin/ops/trips/${id}`),

  getReassignCandidates: (id: string) =>
    apiClient.get<{ data: ReassignCandidate[] }>(
      `/admin/ops/trips/${id}/reassign-candidates`
    ),

  reassign: (id: string, driverId: number) =>
    apiClient.post<{ ok: boolean; trip: TripDetail; message: string }>(
      `/admin/ops/trips/${id}/reassign`,
      { driver_id: driverId }
    ),
};
