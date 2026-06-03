import { apiClient } from "@/core/http/apiClient";

export interface SupportDisputeDetail {
  id: string;
  ticket_id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "normal" | "high";
  category: string;
  reporter_name: string;
  reporter_phone: string;
  franchise_name: string;
  trip_ref: string;
  trip_id: string;
  amount_disputed_fcfa: number;
  created_at: string;
  updated_at: string;
  description: string;
  timeline: {
    id: string;
    label: string;
    description?: string;
    at: string;
    actor: string;
  }[];
  evidence: {
    id: string;
    label: string;
    type: string;
    uploaded_at: string;
  }[];
}

export interface ResolveDisputePayload {
  note?: string;
  outcome?: "full_refund" | "partial_refund" | "rejected" | "standard";
  refund_fcfa?: number;
}

export const disputesService = {
  get: (id: string) =>
    apiClient.get<SupportDisputeDetail>(`/admin/support/disputes/${id}`),

  resolve: (id: string, payload?: ResolveDisputePayload) =>
    apiClient.post<{ ok: boolean; message: string }>(
      `/admin/support/disputes/${id}/resolve`,
      payload
    ),
};
