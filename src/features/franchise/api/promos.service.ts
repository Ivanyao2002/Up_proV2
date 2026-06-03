import { apiClient } from "@/core/http/apiClient";
import type { Paginated } from "@/shared/types";

export interface FranchisePromo {
  id: number;
  code: string;
  label: string;
  discount_pct: number;
  fixed_discount_fcfa?: number;
  uses_count: number;
  max_uses: number;
  status: "active" | "expired" | "draft";
  expires_at: string;
}

export interface FranchiseSupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved";
  partner_name: string;
  created_at: string;
  updated_at: string;
}

export const franchisePromosService = {
  list: () => apiClient.get<Paginated<FranchisePromo>>("/franchise/promos"),
};

export const franchiseSupportService = {
  list: () =>
    apiClient.get<Paginated<FranchiseSupportTicket>>("/franchise/support"),
};
