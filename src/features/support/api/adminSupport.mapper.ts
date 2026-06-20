import { mapV1PaginationToMeta } from "@/core/api/v1Pagination";
import type { ApiV1Pagination } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { paginateClientList } from "@/shared/lib/clientList";
import type { AdminSupportTicket } from "./tickets.service";
import type {
  AgentReporterType,
  AgentTicketCategory,
} from "./agentTicket.types";

export interface ApiSupportTicketItem {
  id: string;
  subject?: string;
  category?: string;
  priority?: string;
  status?: string;
  reporter_name?: string;
  reporterName?: string;
  reporter_type?: string;
  reporterType?: string;
  franchise_name?: string;
  franchiseName?: string;
  dispute_id?: string;
  disputeId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ApiSupportTicketsListResponse {
  status?: string;
  items?: ApiSupportTicketItem[];
  pagination?: ApiV1Pagination;
}

function mapTicketPriority(value?: string | null): AdminSupportTicket["priority"] {
  const key = String(value ?? "normal").toLowerCase();
  if (key === "high" || key === "urgent") return "high";
  if (key === "low") return "low";
  return "normal";
}

function mapTicketStatus(value?: string | null): AdminSupportTicket["status"] {
  const key = String(value ?? "open").toLowerCase();
  if (key === "resolved" || key === "closed") return "resolved";
  if (key === "in_progress" || key === "processing") return "in_progress";
  return "open";
}

function mapTicketCategory(value?: string | null): AgentTicketCategory {
  const key = String(value ?? "").toLowerCase();
  if (
    key === "payment" ||
    key === "behavior" ||
    key === "service" ||
    key === "logistics" ||
    key === "app"
  ) {
    return key;
  }
  return "other";
}

function mapReporterType(value?: string | null): AgentReporterType {
  const key = String(value ?? "").toLowerCase();
  if (key === "driver") return "driver";
  if (key === "deliverer" || key === "livreur") return "deliverer";
  if (key === "partner") return "partner";
  return "client";
}

export function mapSupportTicketItem(item: ApiSupportTicketItem): AdminSupportTicket {
  return {
    id: item.id,
    subject: item.subject ?? "—",
    category: mapTicketCategory(item.category),
    priority: mapTicketPriority(item.priority),
    status: mapTicketStatus(item.status),
    reporter_name: item.reporter_name ?? item.reporterName ?? "—",
    reporter_type: mapReporterType(item.reporter_type ?? item.reporterType),
    franchise_name: item.franchise_name ?? item.franchiseName ?? "—",
    dispute_id: item.dispute_id ?? item.disputeId,
    created_at: item.created_at ?? item.createdAt ?? new Date().toISOString(),
    updated_at: item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
  };
}

export function mapSupportTicketsListResponse(
  response: ApiSupportTicketsListResponse,
  params?: ListParams
): Paginated<AdminSupportTicket> {
  const mapped = (response.items ?? []).map(mapSupportTicketItem);
  if (response.pagination) {
    return {
      data: mapped,
      meta: mapV1PaginationToMeta(response.pagination, params),
    };
  }
  return paginateClientList(mapped, params);
}
