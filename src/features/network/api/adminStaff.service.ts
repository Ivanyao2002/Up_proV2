import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { mapAccountantItem } from "./adminAccountants.mapper";
import { getAdminStaffConfig, type AdminStaffKind } from "./adminStaff.config";
import { mapStaffList } from "./adminStaff.mapper";
import type { StaffCreatePayload, StaffCreateResponse, StaffListItem } from "./adminStaff.types";

export const adminStaffService = {
  list: async (kind: AdminStaffKind, params?: ListParams): Promise<Paginated<StaffListItem>> => {
    const { links } = getAdminStaffConfig(kind);
    const response = await apiClient.get<unknown>(
      `${links.list}${buildV1ListQuery(params)}`
    );
    return mapStaffList(kind, response, params);
  },

  getById: async (kind: AdminStaffKind, id: string): Promise<StaffListItem> => {
    const { links } = getAdminStaffConfig(kind);
    const response = await apiClient.get<unknown>(links.getById(id));
    const item = mapAccountantItem(response, 0);
    if (!item) throw new Error("Utilisateur introuvable");
    return item;
  },

  create: async (
    kind: AdminStaffKind,
    payload: StaffCreatePayload
  ): Promise<StaffCreateResponse> => {
    const { links, createSuccessMessage } = getAdminStaffConfig(kind);
    const result = await apiWithNotify.post<StaffCreateResponse>(
      links.create,
      payload,
      createSuccessMessage
    );
    if (!result) throw new Error("Création échouée");
    return result;
  },

  suspend: (kind: AdminStaffKind, id: string) => {
    const { links, suspendSuccessMessage } = getAdminStaffConfig(kind);
    return apiWithNotify.post(links.suspend(id), {}, suspendSuccessMessage);
  },

  activate: (kind: AdminStaffKind, id: string) => {
    const { links, activateSuccessMessage } = getAdminStaffConfig(kind);
    return apiWithNotify.post(links.activate(id), {}, activateSuccessMessage);
  },
};
