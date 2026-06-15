import { apiClient } from "@/core/http/apiClient";
import { LINKS, appendQuery } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";

export interface FranchisePromoUser {
  id: number;
  full_name: string;
  phone: string;
}

export interface FranchisePromo {
  id: number;
  code: string;
  label: string;
  discount_pct: number;
  fixed_discount_fcfa?: number;
  uses_count: number;
  max_uses: number;
  status: "active" | "expired" | "draft";
  expires_at: string;
  /** Vide = applicable à tous les utilisateurs du territoire */
  assigned_users: FranchisePromoUser[];
}

export interface FranchisePromoRedemption {
  trip_ref: string;
  client_name: string;
  discount_fcfa: number;
  used_at: string;
}

export interface FranchisePromoDetail extends FranchisePromo {
  created_at: string;
  territory_name: string;
  recent_redemptions: FranchisePromoRedemption[];
}

export type FranchisePromoPayload = Omit<
  FranchisePromo,
  "id" | "uses_count" | "assigned_users"
> & {
  assigned_user_ids?: (string | number)[];
};

export const franchisePromosService = {
  list: (params?: ListParams): Promise<Paginated<FranchisePromo>> =>
    useLegacyPortalApi()
      ? apiClient.get<Paginated<FranchisePromo>>(`/franchise/promos${buildListQuery(params)}`)
      : apiClient.get<Paginated<FranchisePromo>>(
          appendQuery(LINKS.franchise.v1.promos, buildV1ListQuery(params))
        ),

  getById: (id: string): Promise<FranchisePromoDetail> =>
    useLegacyPortalApi()
      ? apiClient.get<FranchisePromoDetail>(`/franchise/promos/${id}`)
      : apiClient.get<FranchisePromoDetail>(LINKS.franchise.v1.promoById(id)),

  create: (payload: FranchisePromoPayload) =>
    useLegacyPortalApi()
      ? apiClient.post<FranchisePromo>("/franchise/promos", payload)
      : apiClient.post<FranchisePromo>(LINKS.franchise.v1.promos, payload),
};
