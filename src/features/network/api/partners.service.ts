import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import {
  fetchNetworkLookups,
  resolveCityIdByLabel,
} from "@/core/api/catalogLookup.service";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Paginated, Partner } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type {
  ApiAdminPartnerItem,
  ApiAdminPartnersResponse,
  ApiPartnerCreateBody,
  ApiPartnerCreateResponse,
  ApiPartnerUpdateBody,
} from "./adminPartners.api.types";
import type { ApiV1PartnerDetailResponse } from "./adminPartnerDetail.api.types";
import {
  mapAdminPartnerItemToPartner,
  mapAdminPartnersToPaginated,
} from "./adminPartners.mapper";

import type { PartnerType } from "@/features/network/lib/partnerType";
import { DEFAULT_PARTNER_TYPE } from "@/features/network/lib/partnerType";
import {
  uploadPartnerCreateDocuments,
  type PartnerCreateDocumentUpload,
} from "./partnerCreateDocuments.v1";

export type PartnerCreatePayload = {
  name: string;
  franchise_id: number | string;
  city: string;
  /** UUID ville catalogue — prioritaire sur `city` (libellé). */
  city_id?: string;
  /** Code pays ISO (ex. CI) — dérivé de la ville sélectionnée. */
  country_code?: string;
  contact_email: string;
  /** Mot de passe du compte portail partenaire (min. 6 caractères API). */
  password: string;
  contact_phone: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  status?: Partner["status"];
  partner_type?: PartnerType;
  commission_rate?: number;
};

export type PartnerCreateResult = Partner & {
  portal_login_email?: string;
};

export type PartnerUpdatePayload = {
  name: string;
  city: string;
  city_id?: string;
  contact_email: string;
  contact_phone: string;
  address?: string;
  status?: Partner["status"];
  partner_type?: PartnerType;
  commission_rate?: number;
};

export const partnersService = {
  listAdmin: async (params?: ListParams): Promise<Paginated<Partner>> => {
    if (useLegacyAdminApi()) {
      return apiClient.get<Paginated<Partner>>(
        `/admin/network/partners${buildListQuery(params)}`
      );
    }

    const [response, lookups] = await Promise.all([
      apiClient.get<ApiAdminPartnersResponse>(
        `${LINKS.admin.v1.partners}${buildV1ListQuery(params)}`
      ),
      fetchNetworkLookups(),
    ]);
    return mapAdminPartnersToPaginated(
      response.items ?? [],
      params,
      response.pagination,
      lookups
    );
  },

  create: async (payload: PartnerCreatePayload): Promise<PartnerCreateResult> => {
    if (useLegacyAdminApi()) {
      return apiClient.post<PartnerCreateResult>("/admin/network/partners", payload);
    }

    const cityId =
      payload.city_id?.trim() || (await resolveCityIdByLabel(payload.city));
    if (!cityId) {
      throw new Error("Sélectionnez une ville du catalogue.");
    }

    const email = payload.contact_email.trim();
    const body: ApiPartnerCreateBody = {
      franchiseId: String(payload.franchise_id),
      legalName: payload.name.trim(),
      tradeName: payload.name.trim(),
      cityId,
      email,
      password: payload.password,
      contactEmail: email,
      partnerType: payload.partner_type ?? DEFAULT_PARTNER_TYPE,
      ...(payload.contact_phone.trim()
        ? {
            contactPhone: payload.contact_phone.trim(),
            phone: payload.contact_phone.trim(),
          }
        : {}),
      ...(payload.first_name?.trim() ? { firstName: payload.first_name.trim() } : {}),
      ...(payload.last_name?.trim() ? { lastName: payload.last_name.trim() } : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.commission_rate != null && !Number.isNaN(payload.commission_rate)
        ? { commissionRate: payload.commission_rate }
        : {}),
    };

    const response = await apiClient.post<ApiPartnerCreateResponse>(
      LINKS.v1.partners.create,
      body
    );

    if (!response.partner?.id) {
      throw new Error(
        response.error?.message ?? "Création partenaire sans identifiant en réponse."
      );
    }

    const lookups = await fetchNetworkLookups();
    const partner = mapAdminPartnerItemToPartner(response.partner, lookups);
    const portalLoginEmail =
      response.account?.loginEmail ??
      response.account?.login_email ??
      email;

    return { ...partner, portal_login_email: portalLoginEmail };
  },

  createWithDocuments: async (
    payload: PartnerCreatePayload,
    documents: PartnerCreateDocumentUpload[] = []
  ): Promise<PartnerCreateResult> => {
    const partner = await partnersService.create(payload);
    if (!useLegacyAdminApi() && documents.length > 0) {
      await uploadPartnerCreateDocuments(String(partner.id), documents);
    }
    return partner;
  },

  update: async (id: string, payload: PartnerUpdatePayload): Promise<Partner> => {
    if (useLegacyAdminApi()) {
      return apiClient.patch<Partner>(`/admin/network/partners/${id}`, {
        name: payload.name.trim(),
        city: payload.city.trim(),
        contact_email: payload.contact_email.trim(),
        contact_phone: payload.contact_phone.trim(),
        address: payload.address?.trim(),
        status: payload.status,
      });
    }

    const cityId =
      payload.city_id?.trim() || (await resolveCityIdByLabel(payload.city));
    if (!cityId) {
      throw new Error("Sélectionnez une ville du catalogue.");
    }

    const body: ApiPartnerUpdateBody = {
      legalName: payload.name.trim(),
      tradeName: payload.name.trim(),
      cityId,
      contactEmail: payload.contact_email.trim(),
      ...(payload.partner_type ? { partnerType: payload.partner_type } : {}),
      ...(payload.contact_phone.trim()
        ? { contactPhone: payload.contact_phone.trim() }
        : {}),
      ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.commission_rate != null && !Number.isNaN(payload.commission_rate)
        ? { commissionRate: payload.commission_rate }
        : {}),
    };

    const response = await apiClient.patch<ApiV1PartnerDetailResponse>(
      LINKS.admin.partners.getById(id),
      body
    );

    if (!response.partner?.id) {
      throw new Error(
        "Mise à jour partenaire sans identifiant en réponse."
      );
    }

    const lookups = await fetchNetworkLookups();
    const item: ApiAdminPartnerItem = {
      id: response.partner.id,
      franchise_id: response.partner.franchise_id,
      legal_name: response.partner.legal_name,
      trade_name: response.partner.trade_name,
      name:
        response.partner.name ??
        response.partner.trade_name ??
        response.partner.legal_name,
      city_id: response.partner.city_id,
      contact_phone: response.partner.contact_phone,
      contact_email: response.partner.contact_email,
      status: response.partner.status,
      driversCount: response.partner.stats?.driversCount,
      partner_type: response.partner.partner_type,
      commission_rate: response.partner.commission_rate,
    };
    return mapAdminPartnerItemToPartner(item, lookups);
  },

  activate: (id: string) => {
    if (useLegacyAdminApi()) {
      return apiWithNotify.post(
        `/admin/network/partners/${id}/activate`,
        undefined,
        "Partenaire activé"
      );
    }
    return apiWithNotify.post(
      LINKS.admin.v1.partnerActivate(id),
      undefined,
      "Partenaire activé"
    );
  },

  suspend: (id: string) => {
    if (useLegacyAdminApi()) {
      return apiWithNotify.post(
        `/admin/network/partners/${id}/suspend`,
        undefined,
        "Partenaire suspendu"
      );
    }
    return apiWithNotify.post(
      LINKS.admin.v1.partnerSuspend(id),
      undefined,
      "Partenaire suspendu"
    );
  },

  delete: async (id: string) => {
    if (useLegacyAdminApi()) {
      return apiClient.delete(`/admin/network/partners/${id}`);
    }
    return apiClient.delete(LINKS.admin.v1.partnerById(id));
  },
};
