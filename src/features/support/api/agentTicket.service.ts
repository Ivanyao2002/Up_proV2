import { apiClient } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type {
  AgentTicketDetail,
  AgentTicketMessage,
  AgentSanction,
  AgentCompensation,
  ApplySanctionPayload,
  ApplyCompensationPayload,
  TripSummaryData,
} from "./agentTicket.types";

const T = LINKS.support.tickets;
const TR = LINKS.support.trips;

export const agentTicketService = {
  getById: (id: string): Promise<AgentTicketDetail> =>
    apiClient.get(T.getById(id)),

  assign: (id: string): Promise<{ ok: boolean }> =>
    apiClient.post(T.assign(id)),

  sendMessage: (id: string, content: string): Promise<AgentTicketMessage> =>
    apiClient.post(T.messages(id), { content, type: "message" }),

  addNote: (id: string, content: string): Promise<AgentTicketMessage> =>
    apiClient.post(T.messages(id), { content, type: "internal_note" }),

  requestJustification: (id: string, content: string): Promise<AgentTicketMessage> =>
    apiClient.post(T.messages(id), { content, type: "justification_request" }),

  applySanction: (id: string, payload: ApplySanctionPayload): Promise<AgentSanction> =>
    apiClient.post(T.sanctions(id), payload),

  applyCompensation: (id: string, payload: ApplyCompensationPayload): Promise<AgentCompensation> =>
    apiClient.post(T.compensations(id), payload),

  cancelCompensation: (id: string, compId: string): Promise<{ ok: boolean }> =>
    apiClient.post(T.cancelCompensation(id, compId)),

  resolve: (id: string, note?: string): Promise<{ ok: boolean }> =>
    apiClient.patch(T.resolve(id), { note }),

  close: (id: string, note?: string): Promise<{ ok: boolean }> =>
    apiClient.patch(T.close(id), { note }),

  escalate: (id: string, note?: string): Promise<{ ok: boolean }> =>
    apiClient.post(T.escalate(id), { note }),

  getTripSummary: (tripId: string): Promise<TripSummaryData> =>
    apiClient.get(TR.summary(tripId)),
};
