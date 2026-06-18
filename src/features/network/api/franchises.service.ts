import { apiClient } from "@/core/http/apiClient";
import {
  fetchCityLabelById,
  resolveCityIdByLabel,
} from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { ApiAdminDashboardResponse } from "@/features/ops/api/dashboard.api.types";
import type { Franchise, Paginated } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiAdminFranchiseCreateBody,
  ApiAdminFranchiseCreateResponse,
  ApiAdminFranchiseUpdateBody,
  ApiAdminFranchisesListResponse,
  ApiV1FranchiseDetailResponse,
} from "./adminFranchises.api.types";
import {
  mapDashboardFranchisesToPaginated,
  mapV1FranchiseItemToListItem,
  mapV1FranchisesToPaginated,
} from "./adminFranchises.mapper";
import {
  registerFranchisePortalAccount,
  splitAdminName,
} from "./franchiseRegister.service";

export type FranchiseCreatePayload = {
  name: string;
  city: string;
  /** UUID ville catalogue bootstrap — prioritaire sur `city` (libellé). */
  city_id?: string;
  /** Code pays ISO (ex. CI) — dérivé de la ville sélectionnée. */
  country_code?: string;
  status: Franchise["status"];
  contact_email: string;
  contact_phone: string;
  /** Mot de passe du compte admin franchise (portail /franchise) */
  admin_password: string;
  /** Franchise cible — requis en API réelle (POST /v1/auth/franchise/register) */
  franchise_id?: string;
};

export type FranchiseCreateResponse = Omit<Franchise, "id"> & {
  id: string | number;
  contact_email: string;
  contact_phone: string;
  portal_login_email: string;
};

export type FranchiseUpdatePayload = {
  name: string;
  city: string;
  city_id?: string;
  status: Franchise["status"];
  contact_email: string;
  contact_phone: string;
};

export const franchisesService = {
  listAdmin: async (params?: ListParams): Promise<Paginated<Franchise>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<Franchise>>(
        `/admin/network/franchises${buildListQuery(params)}`
      );
    }

    try {
      const native = await apiClient.get<ApiAdminFranchisesListResponse>(
        `${LINKS.admin.v1.franchises}${buildV1ListQuery(params)}`
      );
      const items = native.items ?? [];
      if (items.length > 0 || native.pagination) {
        return mapV1FranchisesToPaginated(items, params, native.pagination);
      }
    } catch {
      // Fallback dashboard + bootstrap villes
    }

    const [dashboard, cityById] = await Promise.all([
      apiClient.get<ApiAdminDashboardResponse>(LINKS.admin.v1.dashboard),
      fetchCityLabelById(),
    ]);
    const items = dashboard.dashboard?.filters?.options?.franchises ?? [];
    return mapDashboardFranchisesToPaginated(items, params, cityById);
  },

  create: async (payload: FranchiseCreatePayload) => {
    if (useLegacyAdminApi()) {
      return apiClient.post<FranchiseCreateResponse>(
        "/admin/network/franchises",
        payload
      );
    }

    if (payload.franchise_id?.trim()) {
      return registerFranchisePortalAccount(payload);
    }

    const cityId =
      payload.city_id?.trim() || (await resolveCityIdByLabel(payload.city));
    if (!cityId) {
      throw new Error("Sélectionnez une ville du catalogue.");
    }

    const { firstName, lastName } = splitAdminName(payload.name);
    const body: ApiAdminFranchiseCreateBody = {
      name: payload.name.trim(),
      cityId,
      contactEmail: payload.contact_email.trim(),
      contactPhone: payload.contact_phone.trim(),
      adminPassword: payload.admin_password,
      adminFirstName: firstName,
      adminLastName: lastName,
      status: payload.status,
      ...(payload.country_code?.trim()
        ? { countryCode: payload.country_code.trim() }
        : {}),
    };

    const response = await apiClient.post<ApiAdminFranchiseCreateResponse>(
      LINKS.admin.v1.franchises,
      body
    );

    const franchiseId =
      response.franchiseId ?? response.franchise?.id ?? "";
    if (!franchiseId) {
      throw new Error(
        response.error?.message ?? "Création franchise sans identifiant en réponse."
      );
    }

    return {
      id: franchiseId,
      name: response.franchise?.name ?? payload.name.trim(),
      city: payload.city.trim(),
      status: payload.status,
      partners_count: response.franchise?.partnersCount ?? 0,
      drivers_count: response.franchise?.driversCount ?? 0,
      zones_count: response.franchise?.zonesCount ?? 0,
      revenue_month_fcfa: response.franchise?.revenueMonthXof ?? 0,
      contact_email: payload.contact_email.trim(),
      contact_phone: payload.contact_phone.trim(),
      portal_login_email:
        response.portalLoginEmail ?? payload.contact_email.trim(),
    };
  },

  update: async (id: string, payload: FranchiseUpdatePayload) => {
    if (useLegacyAdminApi()) {
      return apiClient.patch<Franchise>(`/admin/network/franchises/${id}`, {
        name: payload.name.trim(),
        city: payload.city.trim(),
        status: payload.status,
        contact_email: payload.contact_email.trim(),
        contact_phone: payload.contact_phone.trim(),
      });
    }

    const cityId =
      payload.city_id?.trim() || (await resolveCityIdByLabel(payload.city));
    if (!cityId) {
      throw new Error("Sélectionnez une ville du catalogue.");
    }

    const body: ApiAdminFranchiseUpdateBody = {
      name: payload.name.trim(),
      cityId,
      contactEmail: payload.contact_email.trim(),
      contactPhone: payload.contact_phone.trim(),
      status: payload.status,
    };

    const response = await apiClient.patch<ApiV1FranchiseDetailResponse>(
      LINKS.admin.franchises.getById(id),
      body
    );

    if (!response.franchise) {
      throw new Error("Mise à jour franchise sans données en réponse.");
    }

    return mapV1FranchiseItemToListItem(response.franchise);
  },

  delete: async (id: string) => {
    if (useLegacyAdminApi()) {
      return apiClient.delete(`/admin/network/franchises/${id}`);
    }
    return apiClient.delete(LINKS.admin.v1.franchiseDelete(id));
  },
};
