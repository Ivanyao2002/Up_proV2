import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery } from "@/shared/types/listParams";
import type {
  ApiSosDashboardResponse,
  ApiSosDetailResponse,
  ApiSosListResponse,
} from "./adminSos.api.types";
import {
  mapSosDashboard,
  mapSosIncidentDetail,
  mapSosIncidentsList,
} from "./adminSos.mapper";
import type {
  AcknowledgeSosPayload,
  ResolveSosPayload,
  SosDashboard,
  SosIncident,
  SosIncidentDetail,
  SosListParams,
} from "./sos.types";

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

export const sosService = {
  getDashboard: async (): Promise<SosDashboard> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<SosDashboard>(LINKS.admin.ops.sos.dashboard);
    }
    const response = await apiClient.get<ApiSosDashboardResponse>(
      LINKS.admin.v1.safety.sosDashboard
    );
    return mapSosDashboard(response);
  },

  listIncidents: async (params?: SosListParams): Promise<Paginated<SosIncident>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<SosIncident>>(
        `${LINKS.admin.ops.sos.list}${buildListQuery(params)}`
      );
    }
    const response = await apiClient.get<ApiSosListResponse>(
      `${LINKS.admin.v1.safety.sos}${buildSosListQuery(params)}`
    );
    return mapSosIncidentsList(response, params);
  },

  getIncidentById: async (id: string): Promise<SosIncidentDetail> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<SosIncidentDetail>(
        LINKS.admin.ops.sos.getById(id)
      );
    }
    const response = await apiClient.get<ApiSosDetailResponse>(
      LINKS.admin.v1.safety.sosById(id)
    );
    return mapSosIncidentDetail(response);
  },

  acknowledge: (id: string, payload?: AcknowledgeSosPayload) => {
    if (useLegacyAdminApi()) {
      return apiWithNotify.post(
        LINKS.admin.ops.sos.acknowledge(id),
        payload ?? {},
        "Incident pris en charge"
      );
    }
    return apiWithNotify.post(
      LINKS.admin.v1.safety.sosAcknowledge(id),
      payload ?? {},
      "Incident pris en charge"
    );
  },

  resolve: (id: string, payload: ResolveSosPayload) => {
    if (useLegacyAdminApi()) {
      return apiWithNotify.post(
        LINKS.admin.ops.sos.resolve(id),
        payload,
        "Incident SOS clôturé"
      );
    }
    return apiWithNotify.post(
      LINKS.admin.v1.safety.sosResolve(id),
      payload,
      "Incident SOS clôturé"
    );
  },
};
