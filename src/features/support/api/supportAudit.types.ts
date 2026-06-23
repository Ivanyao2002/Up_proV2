export type SupportAuditSeverity = "info" | "warning" | "critical";

export type SupportAuditCategory =
  | "ticket"
  | "compensation"
  | "sanction"
  | "escalation"
  | "chat"
  | "auth";

export type SupportAuditAction =
  | "ticket.assigned"
  | "ticket.message_sent"
  | "ticket.note_added"
  | "ticket.justification_requested"
  | "ticket.resolved"
  | "ticket.closed"
  | "ticket.escalated"
  | "sanction.applied"
  | "compensation.applied"
  | "chat.message_sent"
  | "auth.login"
  | "auth.logout";

export interface SupportAuditMetadata {
  sanction_type?: "warning" | "surveillance" | "quality_points" | "suspension";
  compensation_type?: "percentage_discount" | "fixed_discount" | "free_service";
  discount_value?: number;
  promo_code?: string;
  message_type?: "message" | "internal_note" | "justification_request";
  transition_note?: string;
}

export interface SupportAuditEvent {
  id: string;
  at: string;
  actor_email: string;
  actor_name: string;
  action: SupportAuditAction;
  category: SupportAuditCategory;
  severity: SupportAuditSeverity;
  resource_id?: string;
  resource_label?: string;
  detail: string;
  metadata?: SupportAuditMetadata;
}

export interface SupportDashboardStats {
  open_tickets: number;
  in_progress_tickets: number;
  escalated_tickets: number;
  resolved_today: number;
  active_chat_conversations: number;
  anomalies_today: number;
}

export interface SupportDashboardRecentTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "in_progress" | "resolved" | "closed" | "escalated";
  reporter_name: string;
  franchise_name: string;
  created_at: string;
}

export interface SupportDashboardRecentAnomaly {
  id: string;
  at: string;
  action: string;
  category: SupportAuditCategory;
  severity: SupportAuditSeverity;
  resource_id?: string;
  resource_label?: string;
  detail: string;
}

export interface SupportDashboardRecent {
  recent_tickets: SupportDashboardRecentTicket[];
  recent_anomalies: SupportDashboardRecentAnomaly[];
}
