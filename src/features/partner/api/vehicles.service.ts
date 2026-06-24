import { apiClient, apiWithNotify } from "@/core/http/apiClient";
import { useAuthStore } from "@/core/auth/authStore";
import { LINKS } from "@/core/api/links";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import { notificationService } from "@/core/http/notificationService";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import type { VehicleDocumentType } from "@/shared/types/vehicleDocuments";
import type { Paginated, Vehicle, VehicleDetail } from "@/shared/types";
import { buildListQuery, type ListParams } from "@/shared/types/listParams";
import type { ApiAdminVehiclesListResponse } from "@/features/fleet/api/adminVehicles.api.types";
import {
  mapAdminVehiclesToPaginated,
  mapApiVehicleToVehicleDetail,
  mapCategoryCode,
  mapPartnerFreeTextToApiBody,
  mapUiCategoryToApiCode,
} from "@/features/fleet/api/adminVehicles.mapper";
import type { ApiV1VehicleCreateResponse } from "@/features/fleet/api/adminVehicles.api.types";
import {
  fetchVehicleCatalogLookupsForItems,
} from "@/features/fleet/api/vehicleCatalog.service";
import {
  applyVehicleCreateFlow,
  assignDriverV1,
  legacyPartnerDocumentsPath,
} from "@/features/fleet/api/vehicleCreateFlow";
import {
  attachPartnerVehicleRegistration,
  attachPartnerVehicleDocument,
} from "@/features/fleet/api/kycDocumentUpload.v1.service";
import { mapVehicleDocumentTypeToApiCode } from "@/features/fleet/api/documentTypeCodes.v1";
import { partnerDriversService, type CreateDriverPayload } from "./drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { VehiclePieceFile } from "../components/VehicleCreatePiecesSection";

export interface VehiclesListResponse extends Paginated<Vehicle> {
  summary?: {
    approved: number;
    pending: number;
    rejected: number;
    draft: number;
  };
}

interface ApiVehicleItem {
  id: string;
  partner_id: string;
  driver_id: string | null;
  brand_id: string | null;
  model_id: string | null;
  color_id: string | null;
  category_id: string | null;
  plate_number: string | null;
  vin: string | null;
  manufacture_year: number | null;
  seats_count: number | null;
  max_weight_kg: number | null;
  status: "pending" | "approved" | "rejected" | "draft";
  approved_at: string | null;
  metadata?: {
    brand?: string;
    model?: string;
    color?: string;
    category?: string;
    createdFrom?: string;
  };
  created_at: string;
  updated_at: string;
}

interface VehiclesApiResponse {
  status: string;
  items?: ApiVehicleItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  summary?: {
    approved: number;
    pending: number;
    rejected: number;
    draft: number;
  };
}

function mapApiVehicleToVehicle(item: ApiVehicleItem): Vehicle {
  const brand = item.metadata?.brand || "";
  const model = item.metadata?.model || "";
  const color = item.metadata?.color || "—";

  // Mapping category_id vers VehicleCategory
  const categoryMap: Record<string, Vehicle["category"]> = {
    "4c67cefb-f9a6-4937-bbb7-6530540298b5": "taxi",
  };
  const categoryCode = (item.metadata?.category as string) || "";
  const category = categoryMap[item.category_id || ""] || (categoryCode as Vehicle["category"]) || "taxi";

  return {
    id: item.id as unknown as number,
    label: model ? `${brand} ${model}` : brand || `Véhicule ${item.id.slice(0, 8)}`,
    plate: item.plate_number?.trim() || "",
    brand: brand || undefined,
    model: model || undefined,
    category,
    category_code: categoryCode || undefined,
    category_label: categoryCode || undefined,
    year: item.manufacture_year || new Date().getFullYear(),
    color,
    driver_name: item.driver_id ? "Assigné" : null,
    approval_status: item.status,
    created_at: item.created_at,
  };
}

function mapVehiclesResponse(response: VehiclesApiResponse | VehiclesListResponse): VehiclesListResponse {
  // Si la réponse est wrappée avec status: "ok" et items[] (nouveau format backend)
  if ("status" in response && response.status === "ok" && response.items) {
    const vehicles = response.items.map(mapApiVehicleToVehicle);
    return {
      data: vehicles,
      meta: response.pagination ? {
        current_page: response.pagination.page,
        last_page: response.pagination.hasMore ? response.pagination.page + 1 : response.pagination.page,
        per_page: response.pagination.limit,
        total: response.pagination.total,
      } : { current_page: 1, last_page: 1, per_page: 20, total: response.items.length },
      summary: response.summary,
    };
  }
  // Si la réponse est déjà au format VehiclesListResponse (sans wrapper)
  if ("data" in response && Array.isArray(response.data)) {
    return response as VehiclesListResponse;
  }
  return response as VehiclesListResponse;
}

export interface CreateVehiclePayload {
  brand: string;
  model: string;
  year: number;
  color: string;
  category: Vehicle["category"];
  plate?: string;
}

function resolvePartnerId(): string {
  const ownerId = useAuthStore.getState().user?.owner_id;
  if (ownerId == null || !String(ownerId).trim()) {
    throw new Error("Partenaire introuvable dans la session.");
  }
  return String(ownerId);
}

function buildSummary(items: Vehicle[]): VehiclesListResponse["summary"] {
  return items.reduce(
    (acc, item) => {
      acc[item.approval_status] += 1;
      return acc;
    },
    { approved: 0, pending: 0, rejected: 0, draft: 0 }
  );
}

async function listV1(params?: ListParams): Promise<VehiclesListResponse> {
  const partnerId = resolvePartnerId();
  const response = await apiClient.get<
    ApiAdminVehiclesListResponse & {
      summary?: VehiclesListResponse["summary"];
    }
  >(`${LINKS.v1.partners.vehicles(partnerId)}${buildV1ListQuery(params)}`);
  const items = response.items ?? [];
  // Le backend renvoie désormais les labels inline (brandLabel, modelLabel, colorLabel,
  // categoryLabel/categoryCode). On ne charge le catalogue que pour les items qui ont un id
  // de référence mais aucun label inline (anciens payloads) → évite 4 appels catalogue inutiles.
  const needsCatalog = items.some(
    (it) =>
      (it.brand_id && !it.brandLabel && !it.brand?.label) ||
      (it.model_id && !it.modelLabel && !it.model?.label) ||
      (it.color_id && !it.colorLabel && !it.color?.label) ||
      (it.category_id && !it.categoryLabel && !it.categoryCode && !it.category?.label)
  );
  const lookups = needsCatalog
    ? await fetchVehicleCatalogLookupsForItems(items)
    : undefined;
  const paginated = mapAdminVehiclesToPaginated(
    items,
    params,
    response.pagination,
    lookups
  );
  return {
    ...paginated,
    summary: response.summary ?? buildSummary(paginated.data),
  };
}

async function getByIdV1(id: string): Promise<VehicleDetail> {
  const partnerId = resolvePartnerId();

  try {
    // Utilise l'endpoint partenaire spécifique /v1/partners/{partnerId}/vehicles/{vehicleId}
    const raw = await apiClient.get<{
      status?: string;
      vehicle?: Record<string, unknown>;
      registration?: Record<string, unknown>;
      driver?: Record<string, unknown>;
    }>(LINKS.partner.vehicles.getById(partnerId, id));

    const v = raw.vehicle ?? {};

    // Extraction des données du véhicule (API retourne des objets imbriqués)
    const brand = (v.brand as { label?: string })?.label ?? (v.brandLabel as string) ?? "";
    const model = (v.model as { label?: string })?.label ?? (v.modelLabel as string) ?? "";
    const colorObj = v.color as { label?: string; hex?: string } | null;
    const color = colorObj?.label ?? (v.color_name as string) ?? "—";
    const categoryObj = v.category as { code?: string; label?: string } | null;
    const categoryCode = categoryObj?.code ?? (v.categoryCode as string) ?? "";
    const categoryLabel = categoryObj?.label ?? categoryCode;

    // Mapping catégorie API → UI (couvre les 8 codes : ECO, MOTO, FOURGON, CAMION…),
    // cohérent avec la liste véhicules.
    const category = mapCategoryCode(categoryCode);

    // Driver peut être dans raw.driver ou v.driver
    const driver = (raw.driver ?? v.driver) as {
      id?: string;
      displayName?: string;
      profile?: { firstName?: string; lastName?: string };
    } | null;
    const driverName = driver
      ? (driver.displayName ??
        `${driver.profile?.firstName ?? ""} ${driver.profile?.lastName ?? ""}`.trim())
      : null;

    // Documents véhicule (carte grise + assurance) dans documents[]
    const docs = (v.documents ?? []) as Array<{
      id?: string;
      document_type_code?: string;
      document_type_label?: string;
      status?: string;
      uploaded_at?: string;
      submitted_at?: string;
      created_at?: string;
      reviewed_at?: string | null;
      file_url?: string;
    }>;

    const buildDoc = (
      typeCode: "REGISTRATION_CARD" | "INSURANCE",
      fallbackLabel: string
    ): import("@/shared/types").KycDocument => {
      const found = docs.find((d) => d.document_type_code === typeCode);
      if (found) {
        return {
          id: found.id ?? typeCode,
          type: "registration",
          label: found.document_type_label ?? fallbackLabel,
          status: ((found.status as string) ?? "pending") as "pending" | "approved" | "rejected",
          uploaded_at: found.uploaded_at ?? found.submitted_at ?? found.created_at ?? "",
          reviewed_at: found.reviewed_at ?? null,
          preview_url: found.file_url ?? undefined,
          document_type_code: typeCode,
        };
      }
      return {
        id: `missing-${typeCode}`,
        type: "registration",
        label: fallbackLabel,
        status: "pending",
        uploaded_at: "",
        reviewed_at: null,
        document_type_code: typeCode,
      };
    };

    const registrationDoc = buildDoc("REGISTRATION_CARD", "Carte grise");
    const insuranceDoc = buildDoc("INSURANCE", "Assurance");

    const summaryRaw = v.documentsSummary as
      | import("@/shared/types").VehicleDocumentsSummary
      | undefined;

    return {
      id: Number((v.id as string) ?? id),
      label: (v.label as string) ?? (brand || model ? `${brand} ${model}`.trim() : `Véhicule ${String(id).slice(0, 8)}`),
      brand: brand || "—",
      model: model || "—",
      category,
      category_code: categoryCode,
      category_label: categoryLabel,
      // Ne pas fabriquer l'année courante quand l'API ne la fournit pas : 0 → affiché « — ».
      year: (v.manufacture_year as number) ?? (v.year as number) ?? 0,
      color,
      plate: (v.plate_number as string) ?? (v.plate as string) ?? "",
      seats: (v.seats_count as number) ?? (v.seats as number) ?? 0,
      approval_status: ((v.status as string) ?? "pending") as Vehicle["approval_status"],
      driver_id: (v.driver_id as string | null) ?? driver?.id ?? null,
      driver_name: driverName,
      registration_document: registrationDoc,
      insurance_document: insuranceDoc,
      documents_summary: summaryRaw,
      owner_id: partnerId,
      partner_id: (v.partner_id as string) ?? partnerId,
      created_at: (v.created_at as string) ?? new Date().toISOString(),
      approved_at: (v.approved_at as string | null) ?? null,
    };
  } catch {
    // Fallback: recherche dans la liste
    const list = await listV1({ per_page: 200 });
    const match = list.data.find((item) => String(item.id) === id);
    if (!match) {
      throw new Error("Véhicule introuvable.");
    }

    // Ne pas inventer de statut : si le véhicule est approuvé, la carte grise l'est aussi.
    const isApproved = match.approval_status === "approved";
    return {
      ...match,
      brand: match.label.split(" ")[0] ?? "—",
      model: match.label.split(" ").slice(1).join(" ") || "—",
      seats: 0, // inconnu via la liste — l'UI affiche « — » plutôt que « 0 places »
      owner_id: match.partner_id ?? partnerId,
      registration_document: {
        id: "registration",
        type: "registration",
        label: "Carte grise",
        status: isApproved ? "approved" : "pending",
        uploaded_at: match.created_at,
        reviewed_at: null,
      },
      approved_at: null,
    };
  }
}

async function createV1(data: CreateVehiclePayload): Promise<VehicleDetail> {
  const response = await apiClient.post<ApiV1VehicleCreateResponse>(
    LINKS.v1.vehicles.create,
    mapPartnerFreeTextToApiBody({
      partnerId: resolvePartnerId(),
      category: data.category,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      plate: data.plate,
    })
  );

  if (!response.vehicle?.id) {
    throw new Error("Création véhicule sans identifiant en réponse.");
  }

  const detail = mapApiVehicleToVehicleDetail(response.vehicle, {
    categoryById: new Map(),
    categoryByCode: new Map(),
    brandById: new Map(),
    modelById: new Map(),
    colorById: new Map(),
    partnerNameById: new Map(),
  });

  return {
    ...detail,
    label: [data.brand, data.model].filter(Boolean).join(" ").trim() || detail.label,
    brand: data.brand.trim() || detail.brand,
    model: data.model.trim() || detail.model,
    color: data.color.trim() || detail.color,
  };
}

export const partnerVehiclesService = {
  list: async (params?: ListParams) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<VehiclesListResponse>(
        `/partner/vehicles${buildListQuery(params)}`
      );
    }
    return listV1(params);
  },

  getById: async (id: string) => {
    if (useLegacyPortalApi()) {
      return apiClient.get<VehicleDetail>(`/partner/vehicles/${id}`);
    }
    return getByIdV1(id);
  },

  create: async (data: CreateVehiclePayload) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<VehicleDetail>("/partner/vehicles", data);
    }
    return createV1(data);
  },

  uploadRegistration: async (id: string, file: File) => {
    const partnerId = resolvePartnerId();
    if (useLegacyPortalApi()) {
      return apiWithNotify.post<VehicleDetail>(
        `/partner/vehicles/${id}/registration`,
        { filename: file.name },
        "Carte grise envoyée — validation en cours"
      );
    }

    await attachPartnerVehicleRegistration(partnerId, id, file);
    const detail = await getByIdV1(id);
    notificationService.success("Carte grise envoyée — validation en cours");
    return detail;
  },

  uploadDocument: async (id: string, type: VehicleDocumentType, file: File) => {
    const partnerId = resolvePartnerId();
    if (useLegacyPortalApi()) {
      return apiWithNotify.post<VehicleDetail>(
        `/partner/vehicles/${id}/documents`,
        { type, filename: file.name },
        "Document envoyé — validation en cours"
      );
    }

    await attachPartnerVehicleDocument(
      partnerId,
      id,
      file,
      mapVehicleDocumentTypeToApiCode(type)
    );
    const detail = await getByIdV1(id);
    notificationService.success("Document envoyé — validation en cours");
    return detail;
  },

  assignDriver: async (
    vehicleId: number | string,
    driver: { id: string | number; first_name: string; last_name: string }
  ) => {
    if (useLegacyPortalApi()) {
      return apiClient.post<VehicleDetail>(
        `/partner/vehicles/${vehicleId}/assign-driver`,
        {
          driver_id: driver.id,
          driver_name: `${driver.first_name} ${driver.last_name}`,
        }
      );
    }

    const partnerId = resolvePartnerId();
    return assignDriverV1(vehicleId, driver, { partnerId });
  },

  /** Création véhicule, pièces et chauffeur optionnels */
  createWithOptions: async (
    data: CreateVehiclePayload,
    options: {
      pieces?: VehiclePieceFile[];
      driver?: CreateDriverPayload | null;
      driverDocuments?: DriverDocumentFile[];
      driverPhoneVerified?: boolean;
    } = {}
  ): Promise<VehicleDetail> => {
    const legacy = useLegacyPortalApi();
    const vehicle = legacy
      ? await apiClient.post<VehicleDetail>("/partner/vehicles", data)
      : await createV1(data);

    return applyVehicleCreateFlow(
      vehicle,
      {
        ...options,
        partnerId: resolvePartnerId(),
        rideCategoryCode: mapUiCategoryToApiCode(data.category),
      },
      {
        legacyDocumentsPath: legacy ? legacyPartnerDocumentsPath : undefined,
        createDriverWithDocuments: async (driver, documents, context) => {
          const created = await partnerDriversService.createWithDocuments(
            driver,
            documents,
            context
          );
          return {
            id: created.id,
            user_id: created.user_id,
            first_name: driver.first_name,
            last_name: driver.last_name,
          };
        },
        assignDriver: async (vehicleId, driver) => {
          if (legacy) {
            return apiClient.post<VehicleDetail>(
              `/partner/vehicles/${vehicleId}/assign-driver`,
              {
                driver_id: driver.id,
                driver_name: `${driver.first_name} ${driver.last_name}`,
              }
            );
          }
          return assignDriverV1(vehicleId, driver, {
            baseVehicle: vehicle,
            partnerId: resolvePartnerId(),
          });
        },
      }
    );
  },
};
