import { http, HttpResponse } from "msw";
import adminSupportTickets from "../data/admin-support-tickets.json";
import adminSupportChatsSeed from "../data/admin-support-chats.json";
import agentTicketsSeed from "../data/agent-ticket-detail.json";
import tripSummarySeed from "../data/support-trip-summary.json";
import auditLogSeed from "../data/support-audit-log.json";
import dashboardStatsSeed from "../data/support-dashboard-stats.json";
import dashboardRecentSeed from "../data/support-dashboard-recent.json";
import type {
  AdminSupportAttachment,
  AdminSupportChat,
  AdminSupportChatDetail,
  AdminSupportMessage,
} from "@/features/support/api/adminChat.types";
import type {
  AgentApplicableSanctionType,
  AgentTicketDetail,
} from "@/features/support/api/agentTicket.types";
import type {
  SupportAuditAction,
  SupportAuditEvent,
  SupportAuditMetadata,
} from "@/features/support/api/supportAudit.types";
import { paginatedList, parseListQuery, matchesSearch, matchesDateRange } from "../lib/listQuery";

// ── Audit log en mémoire — toutes les actions agents y sont ajoutées ──────────
let auditLogState: SupportAuditEvent[] = JSON.parse(JSON.stringify(auditLogSeed.data));

function logAudit(
  action: SupportAuditAction,
  category: SupportAuditEvent["category"],
  severity: SupportAuditEvent["severity"],
  detail: string,
  resource_id?: string,
  resource_label?: string,
  metadata?: SupportAuditMetadata
) {
  auditLogState.unshift({
    id: `aud-live-${Date.now()}`,
    at: new Date().toISOString(),
    actor_name: "Agent Support",
    actor_email: "agent@upjunoo.ci",
    action,
    category,
    severity,
    detail,
    resource_id,
    resource_label,
    metadata,
  });
}

const agentTicketsState: Record<string, AgentTicketDetail> = JSON.parse(
  JSON.stringify(agentTicketsSeed)
);
const MOCK_SUPPORT_AGENT = {
  id: "10",
  name: "Aya Koné Support",
  email: "support@upjunoo.ci",
} as const;

function getOrBuildAgentTicket(id: string): AgentTicketDetail | null {
  if (agentTicketsState[id]) return agentTicketsState[id];
  const seed = adminSupportTickets.data.find((t) => t.id === id);
  if (!seed) return null;
  const ticket: AgentTicketDetail = {
    id: seed.id,
    subject: seed.subject,
    category: seed.category as AgentTicketDetail["category"],
    priority: seed.priority as AgentTicketDetail["priority"],
    status: seed.status as AgentTicketDetail["status"],
    reporter_name: seed.reporter_name,
    reporter_type: ((seed as typeof seed & { reporter_type?: string }).reporter_type as AgentTicketDetail["reporter_type"]) ?? "client",
    franchise_name: seed.franchise_name,
    assigned_to_id: null,
    assigned_to: null,
    created_at: seed.created_at,
    updated_at: seed.updated_at,
    messages: [
      {
        id: `sys-${id}-init`,
        sender: "system",
        sender_name: "Système",
        content: "Ticket créé et ajouté à la file support.",
        type: "system",
        created_at: seed.created_at,
      },
    ],
    sanctions: [],
    compensations: [],
  };
  agentTicketsState[id] = ticket;
  return ticket;
}

function ticketMutationGuard(ticket: AgentTicketDetail) {
  if (["resolved", "closed", "escalated"].includes(ticket.status)) {
    return HttpResponse.json(
      { code: "TICKET_TERMINAL", message: "Cette réclamation est terminée." },
      { status: 409 }
    );
  }
  if (!ticket.assigned_to_id) {
    return HttpResponse.json(
      {
        code: "TICKET_NOT_ASSIGNED",
        message: "Assignez-vous cette réclamation avant de commencer.",
      },
      { status: 409 }
    );
  }
  if (ticket.assigned_to_id !== MOCK_SUPPORT_AGENT.id) {
    return HttpResponse.json(
      {
        code: "TICKET_ACCESS_DENIED",
        message: `Cette réclamation est prise en charge par ${ticket.assigned_to}.`,
      },
      { status: 403 }
    );
  }
  return null;
}

let adminSupportChatsState: { data: AdminSupportChat[] } = {
  data: adminSupportChatsSeed.data as AdminSupportChat[],
};

function buildAdminChatDetail(chat: AdminSupportChat): AdminSupportChatDetail {
  const samples: Record<string, AdminSupportMessage[]> = {
    "ADM-CH-001": [
      {
        id: "ADM-CH-001-m1",
        author: "UPJUNOO Côte d'Ivoire",
        role: "reporter",
        body: "Bonjour, nous avons un écart sur les commissions Treichville en juin.",
        at: "2026-06-12T09:00:00Z",
      },
      {
        id: "ADM-CH-001-m2",
        author: "Admin UpJunoo",
        role: "agent",
        body: "Bonjour, je regarde le rapport consolidé et je reviens vers vous.",
        at: "2026-06-12T09:45:00Z",
      },
      {
        id: "ADM-CH-001-m3",
        author: "UPJUNOO Côte d'Ivoire",
        role: "reporter",
        body: "Pouvez-vous confirmer le taux appliqué sur Treichville ?",
        at: "2026-06-12T10:30:00Z",
      },
    ],
  };

  return {
    ...chat,
    messages: samples[chat.id] ?? [
      {
        id: `${chat.id}-start`,
        author: chat.participant_name,
        role: "reporter",
        body: chat.last_message_preview,
        at: chat.updated_at,
      },
    ],
  };
}

const adminChatDetails: Record<string, AdminSupportChatDetail> = Object.fromEntries(
  adminSupportChatsState.data.map((chat) => [chat.id, buildAdminChatDetail(chat)])
);

const chatAttachments: Record<string, AdminSupportAttachment> = {};

export const supportHandlers = [
  /* ── Dashboard stats ── */
  http.get("*/v1/support/dashboard/stats", () => {
    return HttpResponse.json(dashboardStatsSeed);
  }),

  /* ── Dashboard recent (tickets en attente + anomalies récentes) ── */
  http.get("*/v1/support/dashboard/recent", () => {
    // recent_anomalies vient du store live (trié desc, 5 dernières)
    const recentAnomalies = [...auditLogState]
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        at: e.at,
        action: e.action,
        category: e.category,
        severity: e.severity,
        resource_id: e.resource_id,
        resource_label: e.resource_label,
        detail: e.detail,
      }));
    return HttpResponse.json({
      ...dashboardRecentSeed,
      recent_anomalies: recentAnomalies,
    });
  }),

  /* ── Support audit log (inclut toutes les actions agents de la session) ── */
  http.get("*/v1/support/audit-log", ({ request }) => {
    const query = parseListQuery(request);
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const resourceType = url.searchParams.get("resource_type");
    const auditCategory = url.searchParams.get("category");
    let items = [...auditLogState];

    if (resourceType === "ticket") {
      items = items.filter((e) => Boolean(e.resource_id?.startsWith("ADM-TK-")));
    }
    if (query.search) {
      items = items.filter((e) =>
        matchesSearch(
          query.search,
          e.actor_email,
          e.actor_name,
          e.action,
          e.detail,
          e.resource_label ?? "",
          e.resource_id ?? ""
        )
      );
    }
    if (query.severity) items = items.filter((e) => e.severity === query.severity);
    if (action) items = items.filter((e) => e.action === action);
    if (auditCategory) items = items.filter((e) => e.category === auditCategory);
    items = items.filter((e) => matchesDateRange(e.at, query));
    items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

    return HttpResponse.json(paginatedList(items, query));
  }),

  /* ── Agent ticket detail ── */
  http.get("*/v1/support/tickets/:id", ({ params }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    return HttpResponse.json(ticket);
  }),

  http.post("*/v1/support/tickets/:id/assign", ({ params }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    if (ticket.assigned_to_id) {
      return HttpResponse.json(
        {
          code: "TICKET_ALREADY_ASSIGNED",
          message: `Ticket déjà pris en charge par ${ticket.assigned_to}.`,
          assigned_to_id: ticket.assigned_to_id,
          assigned_to: ticket.assigned_to,
        },
        { status: 409 }
      );
    }
    ticket.assigned_to_id = MOCK_SUPPORT_AGENT.id;
    ticket.assigned_to = MOCK_SUPPORT_AGENT.name;
    if (ticket.status === "open") ticket.status = "in_progress";
    const now = new Date().toISOString();
    ticket.messages.push({ id: `sys-${Date.now()}`, sender: "system", sender_name: "Système", content: `Ticket pris en charge par ${MOCK_SUPPORT_AGENT.name}.`, type: "system", created_at: now });
    ticket.updated_at = now;
    logAudit("ticket.assigned", "ticket", "info", `Prise en charge du ticket ${id} par ${MOCK_SUPPORT_AGENT.name}.`, id, `Ticket ${id}`);
    return HttpResponse.json({
      ok: true,
      assigned_to_id: ticket.assigned_to_id,
      assigned_to: ticket.assigned_to,
    });
  }),

  http.post("*/v1/support/tickets/:id/messages", async ({ params, request }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    const guard = ticketMutationGuard(ticket);
    if (guard) return guard;
    const body = (await request.json()) as { content?: string; type?: string };
    const msgType = (body.type ?? "message") as AgentTicketDetail["messages"][number]["type"];
    const msg = {
      id: `msg-${Date.now()}`,
      sender: "agent" as const,
      sender_name: "Agent Support",
      content: body.content?.trim() ?? "",
      type: msgType,
      created_at: new Date().toISOString(),
    };
    if (!msg.content) return HttpResponse.json({ message: "Contenu requis" }, { status: 422 });
    ticket.messages.push(msg);
    ticket.updated_at = msg.created_at;
    const auditAction: SupportAuditAction =
      msgType === "internal_note"
        ? "ticket.note_added"
        : msgType === "justification_request"
          ? "ticket.justification_requested"
          : "ticket.message_sent";
    logAudit(
      auditAction,
      "ticket",
      "info",
      `Message envoyé sur le ticket ${id}.`,
      id,
      `Ticket ${id}`,
      { message_type: msgType === "system" ? undefined : msgType }
    );
    return HttpResponse.json(msg, { status: 201 });
  }),

  http.post("*/v1/support/tickets/:id/sanctions", async ({ params, request }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    const guard = ticketMutationGuard(ticket);
    if (guard) return guard;
    const body = (await request.json()) as { type?: string; reason?: string };
    const sanctionType = body.type;
    if (sanctionType === "quality_points" || sanctionType === "suspension") {
      return HttpResponse.json(
        {
          code: "SANCTION_NOT_ALLOWED",
          message: "Cette sanction nécessite une validation administrative.",
        },
        { status: 403 }
      );
    }
    if (sanctionType !== "warning" && sanctionType !== "surveillance") {
      return HttpResponse.json(
        { code: "SANCTION_REASON_INVALID", message: "Type de sanction invalide." },
        { status: 422 }
      );
    }
    const allowedSanctionType = sanctionType as AgentApplicableSanctionType;
    const sanction = {
      id: `sanc-${Date.now()}`,
      type: allowedSanctionType,
      reason: body.reason?.trim() ?? "",
      applied_at: new Date().toISOString(),
      applied_by: "Agent Support",
    };
    ticket.sanctions.push(sanction);
    ticket.updated_at = sanction.applied_at;
    const sev = sanction.type === "surveillance" ? "warning" : "info";
    logAudit(
      "sanction.applied",
      "sanction",
      sev,
      `Sanction appliquée : ${sanction.reason || "aucun motif"}`,
      id,
      `Ticket ${id}`,
      { sanction_type: sanction.type }
    );
    return HttpResponse.json(sanction, { status: 201 });
  }),

  http.post("*/v1/support/tickets/:id/compensations", async ({ params, request }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    const guard = ticketMutationGuard(ticket);
    if (guard) return guard;
    const body = (await request.json()) as { type?: string; discount_value?: number };
    const compType = (body.type ?? "percentage_discount") as AgentTicketDetail["compensations"][number]["type"];
    const promoCode = `PROMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const comp = {
      id: `comp-${Date.now()}`,
      type: compType,
      discount_value: body.discount_value,
      promo_code: promoCode,
      created_at: new Date().toISOString(),
      created_by: "Agent Support",
    };
    ticket.compensations.push(comp);
    ticket.updated_at = comp.created_at;
    const detail = compType === "free_service"
      ? `Geste commercial : service offert. Code : ${promoCode}`
      : compType === "fixed_discount"
        ? `Geste commercial : reduction fixe ${body.discount_value ?? 0} FCFA. Code : ${promoCode}`
        : `Geste commercial : reduction ${body.discount_value ?? 0}%. Code : ${promoCode}`;
    logAudit(
      "compensation.applied",
      "compensation",
      "warning",
      detail,
      id,
      `Ticket ${id}`,
      {
        compensation_type: compType,
        discount_value: body.discount_value,
        promo_code: promoCode,
      }
    );
    return HttpResponse.json(comp, { status: 201 });
  }),

  http.patch("*/v1/support/tickets/:id/resolve", async ({ params, request }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    const guard = ticketMutationGuard(ticket);
    if (guard) return guard;
    const body = (await request.json()) as { note?: string };
    ticket.status = "resolved";
    const now = new Date().toISOString();
    ticket.messages.push({ id: `sys-${Date.now()}`, sender: "system", sender_name: "Systeme", content: ["Ticket resolu.", body.note?.trim()].filter(Boolean).join(" "), type: "system", created_at: now });
    ticket.updated_at = now;
    logAudit("ticket.resolved", "ticket", "info", `Ticket ${id} marque resolu.${body.note ? ` Note: ${body.note}` : ""}`, id, `Ticket ${id}`);
    return HttpResponse.json({ ok: true });
  }),

  http.patch("*/v1/support/tickets/:id/close", async ({ params, request }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    const guard = ticketMutationGuard(ticket);
    if (guard) return guard;
    const body = (await request.json()) as { note?: string };
    ticket.status = "closed";
    const now = new Date().toISOString();
    ticket.messages.push({ id: `sys-${Date.now()}`, sender: "system", sender_name: "Systeme", content: ["Ticket cloture.", body.note?.trim()].filter(Boolean).join(" "), type: "system", created_at: now });
    ticket.updated_at = now;
    logAudit("ticket.closed", "ticket", "info", `Ticket ${id} cloture.${body.note ? ` Note: ${body.note}` : ""}`, id, `Ticket ${id}`);
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/v1/support/tickets/:id/escalate", async ({ params, request }) => {
    const id = String(params.id);
    const ticket = getOrBuildAgentTicket(id);
    if (!ticket) return HttpResponse.json({ message: "Ticket introuvable" }, { status: 404 });
    const guard = ticketMutationGuard(ticket);
    if (guard) return guard;
    const body = (await request.json()) as { note?: string };
    ticket.status = "escalated";
    const now = new Date().toISOString();
    ticket.messages.push({ id: `sys-${Date.now()}`, sender: "system", sender_name: "Systeme", content: ["Ticket escalade vers Administration.", body.note?.trim()].filter(Boolean).join(" "), type: "system", created_at: now });
    ticket.updated_at = now;
    logAudit("ticket.escalated", "escalation", "warning", `Ticket ${id} escalade vers admin.${body.note ? ` Motif: ${body.note}` : ""}`, id, `Ticket ${id}`);
    return HttpResponse.json({ ok: true });
  }),

  /* ── Ticket list ── */
  http.get("*/v1/support/tickets", ({ request }) => {
    const query = parseListQuery(request);
    const category = new URL(request.url).searchParams.get("category");
    let list = adminSupportTickets.data.map((seed) => {
      const detail = getOrBuildAgentTicket(seed.id);
      return {
        ...seed,
        status: detail?.status ?? seed.status,
        assigned_to_id: detail?.assigned_to_id ?? null,
        assigned_to: detail?.assigned_to ?? null,
        updated_at: detail?.updated_at ?? seed.updated_at,
      };
    }).filter((t) =>
      matchesSearch(
        query.search,
        t.id,
        t.subject,
        t.reporter_name,
        t.franchise_name,
        t.category,
        (t as typeof t & { reporter_type?: string }).reporter_type,
        (t as typeof t & { trip_ref?: string }).trip_ref
      )
    );
    // Filtres secondaires d'abord (reporter + catégorie) — les facets statut s'y appliquent.
    if (query.reporter_type) list = list.filter((t) => (t as typeof t & { reporter_type?: string }).reporter_type === query.reporter_type);
    if (category)            list = list.filter((t) => t.category === category);

    // Compteurs par statut sur l'ensemble filtré (avant le filtre statut) → onglets.
    const facets = {
      status: {
        all:         list.length,
        open:        list.filter((t) => t.status === "open").length,
        in_progress: list.filter((t) => t.status === "in_progress").length,
        resolved:    list.filter((t) => t.status === "resolved").length,
      },
    };

    if (query.status) list = list.filter((t) => t.status === query.status);
    return HttpResponse.json({ ...paginatedList(list, query), facets });
  }),

  http.get("*/v1/support/trips/:id/summary", ({ params }) => {
    const id = String(params.id);
    const seed = tripSummarySeed as Record<string, unknown>;
    const trip = seed[id];
    if (!trip) {
      return HttpResponse.json({ message: "Course introuvable" }, { status: 404 });
    }
    return HttpResponse.json(trip);
  }),

  http.get("*/v1/support/chat", ({ request }) => {
    const query = parseListQuery(request);
    let list = adminSupportChatsState.data;
    list = list.filter((c) =>
      matchesSearch(
        query.search,
        c.id,
        c.participant_name,
        c.franchise_city ?? "",
        c.last_message_preview,
        c.subject ?? ""
      )
    );
    if (query.status) list = list.filter((c) => c.status === query.status);
    return HttpResponse.json(paginatedList(list, query));
  }),

  http.get("*/v1/support/chat/:id", ({ params }) => {
    const id = String(params.id);
    const detail = adminChatDetails[id];
    if (!detail) {
      return HttpResponse.json({ message: "Conversation introuvable" }, { status: 404 });
    }
    detail.unread_count = 0;
    const idx = adminSupportChatsState.data.findIndex((c) => c.id === id);
    if (idx >= 0) {
      adminSupportChatsState.data[idx] = {
        ...adminSupportChatsState.data[idx],
        unread_count: 0,
      };
    }
    return HttpResponse.json(detail);
  }),

  http.post(
    "*/v1/support/chat/:id/messages",
    async ({ params, request }) => {
      const id = String(params.id);
      const detail = adminChatDetails[id];
      if (!detail) {
        return HttpResponse.json({ message: "Conversation introuvable" }, { status: 404 });
      }
      if (detail.status === "closed") {
        return HttpResponse.json(
          { code: "CHAT_CLOSED", message: "Conversation clôturée." },
          { status: 409 }
        );
      }
      const body = (await request.json()) as { body?: string; attachment_id?: string };
      const text = (body.body ?? "").trim();
      const attachment = body.attachment_id
        ? chatAttachments[body.attachment_id]
        : undefined;
      if (!text && !attachment) {
        return HttpResponse.json({ message: "Message requis" }, { status: 422 });
      }
      const msg: AdminSupportMessage = {
        id: `ADM-CHM-${Date.now()}`,
        author: "Agent Support",
        role: "agent",
        body: text,
        at: new Date().toISOString(),
        ...(attachment ? { attachment } : {}),
      };
      detail.messages = [...detail.messages, msg];
      detail.last_message_preview = text || `📎 ${attachment?.filename ?? "Pièce jointe"}`;
      detail.updated_at = msg.at;
      const idx = adminSupportChatsState.data.findIndex((c) => c.id === id);
      if (idx >= 0) {
        adminSupportChatsState.data[idx] = {
          ...adminSupportChatsState.data[idx],
          last_message_preview: detail.last_message_preview,
          updated_at: msg.at,
          unread_count: 0,
        };
      }
      return HttpResponse.json(msg, { status: 201 });
    }
  ),

  http.patch("*/v1/support/chat/:id/close", ({ params }) => {
    const id = String(params.id);
    const detail = adminChatDetails[id];
    if (!detail) {
      return HttpResponse.json({ message: "Conversation introuvable" }, { status: 404 });
    }
    detail.status = "closed";
    detail.updated_at = new Date().toISOString();
    const idx = adminSupportChatsState.data.findIndex((c) => c.id === id);
    if (idx >= 0) {
      adminSupportChatsState.data[idx] = {
        ...adminSupportChatsState.data[idx],
        status: "closed",
        updated_at: detail.updated_at,
      };
    }
    logAudit("chat.message_sent", "chat", "info", `Conversation ${id} clôturée.`, id);
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/v1/support/chat/:id/attachments", async ({ params, request }) => {
    const id = String(params.id);
    if (!adminChatDetails[id]) {
      return HttpResponse.json({ message: "Conversation introuvable" }, { status: 404 });
    }
    let filename = "fichier";
    let type: "image" | "pdf" | "document" = "document";
    try {
      const form = await request.formData();
      const file = form.get("file") as File | null;
      if (file) {
        filename = file.name;
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type === "application/pdf") type = "pdf";
      }
    } catch {
      /* body absent en test — on utilise les valeurs par défaut */
    }
    const att: AdminSupportAttachment = {
      id: `att-${Date.now()}`,
      url: `/mock-attachments/${id}/${filename}`,
      type,
      filename,
    };
    chatAttachments[att.id] = att;
    return HttpResponse.json(att, { status: 201 });
  }),

  http.get("*/v1/chat/conversations", ({ request }) => {
    const query = parseListQuery(request);
    let list = adminSupportChatsState.data.map((c) => ({
      id: c.id,
      participantType: "franchise",
      participantName: c.participant_name,
      franchiseId: c.franchise_id,
      franchiseCity: c.franchise_city,
      subject: c.subject,
      lastMessagePreview: c.last_message_preview,
      unreadCount: c.unread_count,
      status: c.status,
      updatedAt: c.updated_at,
    }));
    list = list.filter((c) =>
      matchesSearch(
        query.search,
        c.id,
        c.participantName,
        c.franchiseCity ?? "",
        c.lastMessagePreview,
        c.subject ?? ""
      )
    );
    if (query.status) {
      list = list.filter((c) => c.status === query.status);
    }
    const page = paginatedList(list, query);
    return HttpResponse.json({
      status: "ok",
      items: page.data,
      pagination: {
        page: page.meta.current_page,
        limit: page.meta.per_page,
        total: page.meta.total,
        totalPages: page.meta.last_page,
        hasMore: page.meta.current_page < page.meta.last_page,
      },
    });
  }),

  http.get("*/v1/chat/conversations/:id/messages", ({ params }) => {
    const id = String(params.id);
    const detail = adminChatDetails[id];
    if (!detail) {
      return HttpResponse.json({ status: "ok", items: [] });
    }
    return HttpResponse.json({
      status: "ok",
      items: detail.messages.map((m) => ({
        id: m.id,
        body: m.body,
        authorName: m.author,
        role: m.role,
        createdAt: m.at,
      })),
    });
  }),

  http.post(
    "*/v1/chat/conversations/:id/messages",
    async ({ params, request }) => {
      const id = String(params.id);
      const detail = adminChatDetails[id];
      if (!detail) {
        return HttpResponse.json(
          { message: "Conversation introuvable" },
          { status: 404 }
        );
      }
      const body = (await request.json()) as { body?: string; content?: string };
      const text = (body.body ?? body.content)?.trim();
      if (!text) {
        return HttpResponse.json({ message: "Message requis" }, { status: 422 });
      }
      const msg: AdminSupportMessage = {
        id: `ADM-CHM-${Date.now()}`,
        author: "Admin UpJunoo",
        role: "agent",
        body: text,
        at: new Date().toISOString(),
      };
      detail.messages = [...detail.messages, msg];
      detail.last_message_preview = text;
      detail.updated_at = msg.at;
      return HttpResponse.json(
        {
          id: msg.id,
          body: msg.body,
          authorName: msg.author,
          role: msg.role,
          createdAt: msg.at,
        },
        { status: 201 }
      );
    }
  ),
];
