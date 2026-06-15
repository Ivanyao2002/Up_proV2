import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { Paginated } from "@/shared/types";
import { buildListQuery } from "@/shared/types/listParams";
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

export const franchiseSosService = {
  getDashboard: async (): Promise<SosDashboard> => {
    const response = await apiClient.get<ApiSosDashboardResponse>(
      LINKS.franchise.v1.sos.dashboard
    );
    return mapSosDashboard(response);
  },

  listIncidents: async (params?: SosListParams): Promise<Paginated<SosIncident>> => {
    const response = await apiClient.get<ApiSosListResponse>(
      `${LINKS.franchise.v1.sos.list}${buildSosListQuery(params)}`
    );
    return mapSosIncidentsList(response, params);
  },

  getIncidentById: async (id: string): Promise<SosIncidentDetail> => {
    const response = await apiClient.get<ApiSosDetailResponse>(
      LINKS.franchise.v1.sos.byId(id)
    );
    return mapSosIncidentDetail(response);
  },

  acknowledge: (id: string, payload?: AcknowledgeSosPayload) => {
    return apiWithNotify.post(
      LINKS.franchise.v1.sos.acknowledge(id),
      payload ?? {},
      "Incident pris en charge"
    );
  },

  resolve: (id: string, payload: ResolveSosPayload) => {
    return apiWithNotify.post(
      LINKS.franchise.v1.sos.resolve(id),
      payload,
      "Incident SOS clôturé"
    );
  },
};
