import { http, HttpResponse } from "msw";
import disputesListSeed from "../data/disputes-list.json";
import disputeDetailSeed from "../data/dispute-detail.json";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";
import type { Dispute, DisputeDetail, DisputeMessage } from "@/features/disputes/api/dispute.types";

const MOCK_AGENT = { id: "10", name: "Aya Koné Support" } as const;

// ── Assistant IA RAG (simulation) ───────────────────────────────────────────
// Le vrai RAG est cote backend (voir BACKEND_SUPPORT_API.md #8). Ici on simule
// une reponse grounded par categorie pour montrer l'UX avant prise en charge.
const AI_REPLIES: Record<Dispute["category"], { content: string; sources: string[]; confidence: number }> = {
  payment: {
    content:
      "Bonjour, je suis l'assistant Up Junoo. J'ai bien noté votre problème de facturation. Les remboursements et corrections de débit sont traités sous 48 à 72h ouvrées après vérification par un agent. Un conseiller va examiner la transaction et revenir vers vous.",
    sources: ["kb_double_debit", "kb_delais_remboursement"],
    confidence: 0.81,
  },
  behavior: {
    content:
      "Bonjour, je suis l'assistant Up Junoo. Je suis navré pour cette expérience. Votre signalement concernant le comportement du chauffeur a bien été enregistré et sera examiné par un agent qui pourra prendre les mesures appropriées. Pouvez-vous préciser ce qui s'est passé ?",
    sources: ["kb_comportement_chauffeur"],
    confidence: 0.78,
  },
  service: {
    content:
      "Bonjour, je suis l'assistant Up Junoo. Je comprends votre désagrément concernant cette course. En cas de chauffeur introuvable ou d'annulation, un agent vérifiera les détails du trajet et vous proposera une solution. Je transmets votre demande.",
    sources: ["kb_annulation"],
    confidence: 0.72,
  },
  logistics: {
    content:
      "Bonjour, je suis l'assistant Up Junoo. Votre signalement concernant la livraison a été enregistré. Pour un colis endommagé ou non livré, un agent examinera les preuves et traitera votre dossier. Conservez si possible une photo du colis.",
    sources: ["kb_livraison"],
    confidence: 0.74,
  },
  app: {
    content:
      "Bonjour, je suis l'assistant Up Junoo. Merci pour ce signalement technique. Un agent va vérifier si une transaction a été affectée. En attendant, pensez à mettre à jour l'application vers la dernière version.",
    sources: [],
    confidence: 0.45,
  },
  other: {
    content:
      "Bonjour, je suis l'assistant Up Junoo. J'ai bien reçu votre demande. Je transmets votre dossier à un agent qui vous répondra rapidement.",
    sources: [],
    confidence: 0.4,
  },
};

// Message d'accueil prédéfini envoyé automatiquement à l'assignation.
// Côté réel, ce template vit côté backend (voir BACKEND_SUPPORT_API.md §assign).
function buildAgentGreeting(reporterName: string, agentName: string): string {
  return `Bonjour ${reporterName}, je suis ${agentName} de l'équipe support Up Junoo. Je prends en charge votre demande. Pouvez-vous m'en dire un peu plus sur ce qui s'est passé afin que je puisse vous aider au mieux ?`;
}

function buildAiMessage(category: Dispute["category"], createdAtBase: string): DisputeMessage {
  const reply = AI_REPLIES[category] ?? AI_REPLIES.other;
  return {
    id: `ai-${Date.now()}`,
    sender: "ai",
    sender_name: "Assistant IA",
    content: reply.content,
    ai_confidence: reply.confidence,
    ai_sources: reply.sources,
    created_at: new Date(new Date(createdAtBase).getTime() + 30_000).toISOString(),
  };
}

let disputesState: Dispute[] = JSON.parse(JSON.stringify(disputesListSeed.data));
const disputeDetailsState: Record<string, DisputeDetail> = JSON.parse(
  JSON.stringify(disputeDetailSeed)
);

function getOrBuildDetail(id: string): DisputeDetail | null {
  if (disputeDetailsState[id]) return disputeDetailsState[id];
  const seed = disputesState.find((d) => d.id === id);
  if (!seed) return null;
  const messages: DisputeMessage[] = [
    {
      id: `${id}-sys-init`,
      sender: "system",
      sender_name: "Système",
      content: "Litige ouvert via l'application mobile.",
      created_at: seed.created_at,
    },
  ];
  // L'IA repond automatiquement tant qu'aucun agent n'a pris la main.
  if (seed.status === "open" && !seed.assigned_to_id) {
    messages.push(buildAiMessage(seed.category, seed.created_at));
  }
  const detail: DisputeDetail = { ...seed, messages };
  disputeDetailsState[id] = detail;
  return detail;
}

function syncListItem(updated: DisputeDetail) {
  disputesState = disputesState.map((d) =>
    d.id === updated.id
      ? {
          id: updated.id,
          subject: updated.subject,
          description: updated.description,
          category: updated.category,
          status: updated.status,
          reporter_name: updated.reporter_name,
          reporter_phone: updated.reporter_phone,
          trip_id: updated.trip_id,
          trip_ref: updated.trip_ref,
          assigned_to: updated.assigned_to,
          assigned_to_id: updated.assigned_to_id,
          created_at: updated.created_at,
          updated_at: new Date().toISOString(),
        }
      : d
  );
}

export const disputesHandlers = [
  // GET /v1/disputes — liste paginée avec filtres
  http.get("*/v1/disputes", ({ request }) => {
    const query = parseListQuery(request);
    const url   = new URL(request.url);
    const categoryParam = url.searchParams.get("category");

    let rows = [...disputesState];

    if (query.status && query.status !== "all")
      rows = rows.filter((d) => d.status === query.status);
    if (categoryParam && categoryParam !== "all")
      rows = rows.filter((d) => d.category === categoryParam);
    if (query.search)
      rows = rows.filter((d) =>
        matchesSearch(query.search, d.subject, d.reporter_name, d.trip_ref ?? null)
      );

    const statusCounts = disputesState.reduce<Record<string, number>>((acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      acc["all"]    = (acc["all"] ?? 0) + 1;
      return acc;
    }, {});

    const paginated = paginatedList(rows, query);
    return HttpResponse.json({ ...paginated, facets: { status: statusCounts } });
  }),

  // GET /v1/disputes/:id — détail
  http.get("*/v1/disputes/:id", ({ params }) => {
    const detail = getOrBuildDetail(params.id as string);
    if (!detail) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    return HttpResponse.json(detail);
  }),

  // PATCH /v1/disputes/:id/assign
  http.patch("*/v1/disputes/:id/assign", ({ params }) => {
    const detail = getOrBuildDetail(params.id as string);
    if (!detail) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });

    detail.assigned_to = MOCK_AGENT.name;
    detail.assigned_to_id = MOCK_AGENT.id;
    detail.status = "in_progress";
    detail.updated_at = new Date().toISOString();
    const now = Date.now();
    // 1. Trace système : l'IA se désactive, l'humain prend la main.
    detail.messages.push({
      id: `${detail.id}-sys-assign-${now}`,
      sender: "system",
      sender_name: "Système",
      content: `${MOCK_AGENT.name} a pris en charge le litige. L'assistant IA est désactivé.`,
      created_at: new Date(now).toISOString(),
    });
    // 2. Message d'accueil prédéfini envoyé automatiquement au client.
    detail.messages.push({
      id: `${detail.id}-greeting-${now}`,
      sender: "agent",
      sender_name: MOCK_AGENT.name,
      content: buildAgentGreeting(detail.reporter_name, MOCK_AGENT.name),
      created_at: new Date(now + 1000).toISOString(),
    });
    syncListItem(detail);
    return HttpResponse.json(detail);
  }),

  // POST /v1/disputes/:id/messages
  http.post("*/v1/disputes/:id/messages", async ({ params, request }) => {
    const detail = getOrBuildDetail(params.id as string);
    if (!detail) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });

    const body = (await request.json()) as { content: string };
    if (!body.content?.trim())
      return HttpResponse.json({ code: "CONTENT_REQUIRED" }, { status: 422 });

    const msg: DisputeMessage = {
      id: `${detail.id}-msg-${Date.now()}`,
      sender: "agent",
      sender_name: MOCK_AGENT.name,
      content: body.content,
      created_at: new Date().toISOString(),
    };
    detail.messages.push(msg);
    detail.updated_at = new Date().toISOString();
    syncListItem(detail);
    return HttpResponse.json(msg, { status: 201 });
  }),

  // PATCH /v1/disputes/:id/resolve
  http.patch("*/v1/disputes/:id/resolve", ({ params }) => {
    const detail = getOrBuildDetail(params.id as string);
    if (!detail) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });

    detail.status = "resolved";
    detail.updated_at = new Date().toISOString();
    detail.messages.push({
      id: `${detail.id}-sys-resolve-${Date.now()}`,
      sender: "system",
      sender_name: "Système",
      content: "Litige marqué comme résolu.",
      created_at: new Date().toISOString(),
    });
    syncListItem(detail);
    return HttpResponse.json({ ok: true });
  }),

  // PATCH /v1/disputes/:id/close
  http.patch("*/v1/disputes/:id/close", ({ params }) => {
    const detail = getOrBuildDetail(params.id as string);
    if (!detail) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });

    detail.status = "closed";
    detail.updated_at = new Date().toISOString();
    detail.messages.push({
      id: `${detail.id}-sys-close-${Date.now()}`,
      sender: "system",
      sender_name: "Système",
      content: "Litige clôturé.",
      created_at: new Date().toISOString(),
    });
    syncListItem(detail);
    return HttpResponse.json({ ok: true });
  }),

  // PATCH /v1/disputes/:id/escalate
  http.patch("*/v1/disputes/:id/escalate", ({ params }) => {
    const detail = getOrBuildDetail(params.id as string);
    if (!detail) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });

    detail.status = "escalated";
    detail.updated_at = new Date().toISOString();
    detail.messages.push({
      id: `${detail.id}-sys-escalate-${Date.now()}`,
      sender: "system",
      sender_name: "Système",
      content: "Litige escaladé — transmis au niveau de support supérieur.",
      created_at: new Date().toISOString(),
    });
    syncListItem(detail);
    return HttpResponse.json({ ok: true });
  }),
];
