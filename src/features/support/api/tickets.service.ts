import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";

export interface AdminSupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved";
  reporter_name: string;
  franchise_name: string;
  dispute_id?: string;
  created_at: string;
  updated_at: string;
}

export const supportTicketsService = {
  list: () =>
    apiClient.get<Paginated<AdminSupportTicket>>("/admin/support/tickets"),
};
