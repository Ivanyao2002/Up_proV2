import { LINKS } from "@/core/api/links";
import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { Paginated } from "@/shared/types";
import type { ListParams } from "@/shared/types/listParams";
import { mapAccountantItem, mapAccountantsList } from "./adminAccountants.mapper";
import type {
  AccountantCreatePayload,
  AccountantCreateResponse,
  AccountantListItem,
} from "./adminAccountants.types";

export const adminAccountantsService = {
  list: async (params?: ListParams): Promise<Paginated<AccountantListItem>> => {
    const response = await apiClient.get<unknown>(
      `${LINKS.admin.v1.accountants.list}${buildV1ListQuery(params)}`
    );
    return mapAccountantsList(response, params);
  },

  getById: async (id: string): Promise<AccountantListItem> => {
    const response = await apiClient.get<unknown>(LINKS.admin.v1.accountants.getById(id));
    const item = mapAccountantItem(response, 0);
    if (!item) throw new Error("Comptable introuvable");
    return item;
  },

  create: async (payload: AccountantCreatePayload): Promise<AccountantCreateResponse> => {
    const result = await apiWithNotify.post<AccountantCreateResponse>(
      LINKS.admin.v1.accountants.create,
      payload,
      "Comptable créé"
    );
    if (!result) throw new Error("Création du comptable échouée");
    return result;
  },

  suspend: (id: string) =>
    apiWithNotify.post(
      LINKS.admin.v1.accountants.suspend(id),
      {},
      "Comptable suspendu"
    ),

  activate: (id: string) =>
    apiWithNotify.post(
      LINKS.admin.v1.accountants.activate(id),
      {},
      "Comptable réactivé"
    ),
};
