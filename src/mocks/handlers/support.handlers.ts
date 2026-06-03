import { http, HttpResponse } from "msw";
import adminSupportTickets from "../data/admin-support-tickets.json";
import adminDisputeDetail from "../data/admin-dispute-detail.json";

let disputeState = { ...adminDisputeDetail };

export const supportHandlers = [
  http.get("*/api/v2/admin/support/tickets", () => {
    return HttpResponse.json(adminSupportTickets);
  }),

  http.get("*/api/v2/admin/support/disputes/:id", ({ params }) => {
    const id = String(params.id);
    if (id !== disputeState.id && id !== "DSP-501") {
      return HttpResponse.json({ message: "Litige introuvable" }, { status: 404 });
    }
    return HttpResponse.json({ ...disputeState, id: id || disputeState.id });
  }),

  http.post("*/api/v2/admin/support/disputes/:id/resolve", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as {
      note?: string;
      outcome?: string;
      refund_fcfa?: number;
    };
    const note = body.note?.trim() || "Litige clôturé";
    const outcomeLabel =
      body.outcome === "full_refund"
        ? "Remboursement intégral"
        : body.outcome === "partial_refund"
          ? `Remboursement partiel${body.refund_fcfa ? ` (${body.refund_fcfa} FCFA)` : ""}`
          : body.outcome === "rejected"
            ? "Réclamation rejetée"
            : "Résolution standard";

    disputeState = {
      ...disputeState,
      id,
      status: "resolved",
      updated_at: new Date().toISOString(),
      timeline: [
        ...disputeState.timeline,
        {
          id: "resolved-now",
          label: outcomeLabel,
          description: note,
          at: new Date().toISOString(),
          actor: "admin@upjunoo.ci",
        },
      ],
    };
    return HttpResponse.json({
      ok: true,
      message: "Litige marqué comme résolu",
    });
  }),
];
