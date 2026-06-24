import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { AssistantApiResponse } from "@/features/assistant/types";
import { assistantApiGet, str } from "./assistantApiClient";
import { searchEntityMatches, getItemId, getItemLabel } from "./entityResolver";

export async function buildDisputeSummaryReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const list = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.support.tickets.list}${buildV1ListQuery({ per_page: 50, page: 1 })}`,
    authHeader
  );
  const items = (list?.items ?? []).filter(
    (t) => t.dispute_id != null || /litige|dispute/i.test(str(t.category ?? t.subject))
  );
  const q = query.toLowerCase().trim();

  const filtered = q
    ? items.filter((d) => {
        const hay = [
          d.id,
          d.reference,
          d.subject,
          d.description,
          d.trip_id,
          d.order_id,
        ]
          .map((x) => str(x).toLowerCase())
          .join(" ");
        return hay.includes(q) || q.split(/\s+/).every((w) => hay.includes(w));
      })
    : items.slice(0, 5);

  if (!filtered.length) {
    return {
      message: q
        ? `Aucun litige trouvé pour « ${query} ».`
        : "Aucun litige ouvert récemment.",
      action: { type: "LIST_ENTITY", entity: "disputes" },
    };
  }

  const lines = filtered.slice(0, 5).map((d) => {
    const ref = str(d.reference ?? d.id);
    const status = str(d.status);
    const subject = str(d.subject ?? d.reason ?? d.type);
    return `• ${ref} — ${subject} (${status})`;
  });

  const open = filtered.filter((d) => {
    const s = str(d.status).toLowerCase();
    return s === "open" || s === "pending" || s === "in_progress";
  }).length;

  return {
    message: [
      q ? `Litiges — recherche « ${query} »` : "Litiges récents",
      `${filtered.length} résultat(s)${open ? `, ${open} ouvert(s)` : ""}`,
      "",
      lines.join("\n"),
    ].join("\n"),
    action: { type: "LIST_ENTITY", entity: "disputes" },
  };
}

export async function buildSupportTicketSummaryReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const list = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.support.tickets.list}${buildV1ListQuery({ per_page: 50, page: 1 })}`,
    authHeader
  );
  const items = list?.items ?? [];
  const q = query.toLowerCase().trim();

  const filtered = q
    ? items.filter((d) => {
        const hay = [d.id, d.subject, d.description, d.requester_name]
          .map((x) => str(x).toLowerCase())
          .join(" ");
        return hay.includes(q) || q.split(/\s+/).every((w) => hay.includes(w));
      })
    : items.slice(0, 5);

  if (!filtered.length) {
    return {
      message: q ? `Aucun ticket pour « ${query} ».` : "Aucun ticket récent.",
      action: { type: "LIST_ENTITY", entity: "tickets" },
    };
  }

  const lines = filtered.slice(0, 5).map((d) => {
    const subj = str(d.subject ?? d.category);
    const status = str(d.status);
    const prio = str(d.priority);
    return `• ${subj} — ${status}${prio !== "—" ? ` (${prio})` : ""}`;
  });

  return {
    message: [
      q ? `Tickets support — « ${query} »` : "Tickets support récents",
      "",
      lines.join("\n"),
    ].join("\n"),
    action: { type: "LIST_ENTITY", entity: "tickets" },
  };
}

export async function buildDisputeDetailByQuery(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const summary = await buildDisputeSummaryReport(query, authHeader);
  const matches = await searchEntityMatches("disputes", query, authHeader);
  if (matches.length) {
    const id = getItemId(matches[0]!);
    return {
      ...summary,
      action: { type: "OPEN_ENTITY", entity: "disputes", id },
    };
  }
  return summary;
}

export async function buildTicketDetailByQuery(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const summary = await buildSupportTicketSummaryReport(query, authHeader);
  const matches = await searchEntityMatches("tickets", query, authHeader);
  if (matches.length) {
    const id = getItemId(matches[0]!);
    return {
      ...summary,
      action: { type: "OPEN_ENTITY", entity: "tickets", id },
    };
  }
  return summary;
}
