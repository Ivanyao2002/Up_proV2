import { apiClient } from "@/core/http/apiClient";
import { LINKS, withListQuery } from "@/core/api/links";
import type { ListParams } from "@/shared/types/listParams";
import type { Dispute, DisputeDetail, DisputeListResponse } from "./dispute.types";

export const disputeService = {
  list: (params?: ListParams): Promise<DisputeListResponse> =>
    apiClient.get(withListQuery(LINKS.disputes.list, params)),

  getById: (id: string): Promise<DisputeDetail> =>
    apiClient.get(LINKS.disputes.getById(id)),

  assign: (id: string): Promise<DisputeDetail> =>
    apiClient.patch(LINKS.disputes.assign(id)),

  sendMessage: (id: string, content: string): Promise<{ id: string }> =>
    apiClient.post(LINKS.disputes.messages(id), { content }),

  resolve: (id: string): Promise<{ ok: boolean }> =>
    apiClient.patch(LINKS.disputes.resolve(id)),

  close: (id: string): Promise<{ ok: boolean }> =>
    apiClient.patch(LINKS.disputes.close(id)),

  escalate: (id: string): Promise<{ ok: boolean }> =>
    apiClient.patch(LINKS.disputes.escalate(id)),
};
