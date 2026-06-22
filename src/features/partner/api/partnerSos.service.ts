import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import type {
  ApiSosDashboardResponse,
  ApiSosDetailResponse,
  ApiSosListResponse,
} from "@/features/safety/api/adminSos.api.types";
import {
  mapSosDashboard,
  mapSosIncidentDetail,
  mapSosIncidentsList,
} from "@/features/safety/api/adminSos.mapper";
import type {
  AcknowledgeSosPayload,
  ResolveSosPayload,
  SosDashboard,
  SosIncident,
  SosIncidentDetail,
  SosListParams,
} from "@/features/safety/api/sos.types";

function buildSosListQuery(params?: SosListParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  const page = params.page ?? 1;
  const limit = params.per_page ?? 25;
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.severity && params.severity !== "all") {
    qs.set("severity", params.severity);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const partnerSosService = {
  getDashboard: async (partnerId: string | number): Promise<SosDashboard> => {
    const response = await apiClient.get<ApiSosDashboardResponse>(
      LINKS.partner.safety.sos.dashboard(partnerId)
    );
    return mapSosDashboard(response);
  },

  listIncidents: async (
    partnerId: string | number,
    params?: SosListParams
  ): Promise<Paginated<SosIncident>> => {
    const response = await apiClient.get<ApiSosListResponse>(
      `${LINKS.partner.safety.sos.list(partnerId)}${buildSosListQuery(params)}`
    );
    return mapSosIncidentsList(response, params);
  },

  getIncidentById: async (
    partnerId: string | number,
    id: string
  ): Promise<SosIncidentDetail> => {
    const response = await apiClient.get<ApiSosDetailResponse>(
      LINKS.partner.safety.sos.getById(partnerId, id)
    );
    return mapSosIncidentDetail(response);
  },

  acknowledge: async (
    partnerId: string | number,
    id: string,
    payload?: AcknowledgeSosPayload
  ) => {
    return apiWithNotify.post(
      LINKS.partner.safety.sos.acknowledge(partnerId, id),
      payload ?? {},
      "Incident pris en charge"
    );
  },

  resolve: async (
    partnerId: string | number,
    id: string,
    payload: ResolveSosPayload
  ) => {
    return apiWithNotify.post(
      LINKS.partner.safety.sos.resolve(partnerId, id),
      payload,
      "Incident SOS clôturé"
    );
  },
};
