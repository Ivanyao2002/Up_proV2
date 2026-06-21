import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { AgentReporterType, AgentTicketCategory } from "./agentTicket.types";

export interface AdminSupportTicket {
  id: string;
  subject: string;
  category?: AgentTicketCategory | null;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved";
  reporter_name: string;
  reporter_type: AgentReporterType;
  franchise_name: string;
  assigned_to_id?: string | null;
  assigned_to?: string | null;
  trip_ref?: string;
  dispute_id?: string;
  created_at: string;
  updated_at: string;
}

/** Compteurs par statut sur l'ensemble filtré (hors filtre statut) — pour les onglets. */
export interface SupportTicketStatusFacets {
  all: number;
  open: number;
  in_progress: number;
  resolved: number;
}

export interface SupportTicketsListResponse extends Paginated<AdminSupportTicket> {
  facets?: { status: SupportTicketStatusFacets };
}

export const supportTicketsService = {
  list: (params?: ListParams): Promise<SupportTicketsListResponse> =>
    apiClient.get(`${LINKS.support.tickets.list}${buildListQuery(params)}`),
};
