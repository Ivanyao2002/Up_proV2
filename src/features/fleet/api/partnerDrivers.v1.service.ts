import { apiClient, requestWithToken } from "@/core/http/apiClient";
import { LINKS } from "@/core/api/links";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { DriverDetail } from "@/shared/types";
import { uploadDriverDocumentsForPartner } from "./kycDocumentUpload.v1.service";

const DEV_DRIVER_PASSWORD = "Upjunoo@Dev2026!";

export interface CreateDriverV1Context {
  partnerId?: string;
  rideCategoryCode?: string;
  phoneVerified?: boolean;
}

interface ApiDriverRegisterResponse {
  accessToken?: string;
  session?: { access_token?: string };
  user?: { id?: string };
  profile?: { id?: string };
}

interface ApiDriverOnboardingResponse {
  driver?: {
    id: string;
    user_id?: string;
    partner_id?: string | null;
  };
}

interface ApiPartnerDriverCreateResponse {
  driver?: {
    id: string;
    user_id?: string;
    partner_id?: string | null;
  };
}

function buildPlaceholderEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "") || "unknown";
  return `driver.${digits}.${Date.now()}@placeholder.upjunoo.dev`;
}

function mapToDriverDetail(
  driverId: string,
  payload: CreateDriverPayload
): DriverDetail {
  const now = new Date().toISOString();
  return {
    id: driverId,
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
    phone: payload.phone.trim(),
    zone: payload.zone?.trim() || "—",
    rating: 0,
    availability: "offline",
    account_status: "pending",
    registered_at: now,
    approved_at: null,
    stats: {
      trips_total: 0,
      trips_completed: 0,
      trips_cancelled: 0,
      acceptance_rate_pct: 0,
      wallet_balance_fcfa: 0,
    },
    timeline: [],
    kyc_documents: [],
    email: payload.email?.trim() || undefined,
  };
}

/** Backoffice partenaire — chauffeur rattaché au bon `partner_id` (testé live). */
async function createDriverViaPartnerApi(
  payload: CreateDriverPayload,
  context: CreateDriverV1Context
): Promise<DriverDetail> {
  if (context.phoneVerified !== true) {
    throw new Error(
      "Le numéro de téléphone doit être vérifié par OTP avant la création du chauffeur."
    );
  }

  const partnerId = context.partnerId!.trim();
  const email = payload.email?.trim() || buildPlaceholderEmail(payload.phone);

  const response = await apiClient.post<ApiPartnerDriverCreateResponse>(
    LINKS.v1.partners.drivers(partnerId),
    {
      firstName: payload.first_name.trim(),
      lastName: payload.last_name.trim(),
      phone: payload.phone.trim(),
      email,
      password: DEV_DRIVER_PASSWORD,
      rideCategoryCode: context.rideCategoryCode ?? "ECO",
    }
  );

  const driverId = response.driver?.id;
  if (!driverId) {
    throw new Error("Création chauffeur partenaire : identifiant manquant en réponse.");
  }

  const detail = mapToDriverDetail(driverId, payload);
  if (response.driver?.user_id) detail.user_id = response.driver.user_id;
  return detail;
}

export async function createDriverViaV1(
  payload: CreateDriverPayload,
  context: CreateDriverV1Context = {}
): Promise<DriverDetail> {
  if (context.partnerId?.trim()) {
    return createDriverViaPartnerApi(payload, context);
  }

  const email = payload.email?.trim() || buildPlaceholderEmail(payload.phone);

  const register = await apiClient.post<ApiDriverRegisterResponse>(
    LINKS.auth.v1.driverRegister,
    {
      phone: payload.phone.trim(),
      firstName: payload.first_name.trim(),
      lastName: payload.last_name.trim(),
      email,
      password: DEV_DRIVER_PASSWORD,
    }
  );

  const driverToken =
    register.accessToken ?? register.session?.access_token ?? "";
  if (!driverToken) {
    throw new Error(
      "Inscription chauffeur : aucun token en réponse (vérifiez téléphone / email)."
    );
  }

  const userId = register.user?.id ?? register.profile?.id;
  const onboardBody: Record<string, unknown> = {
    rideCategoryCode: context.rideCategoryCode ?? "ECO",
    acceptsCash: true,
    acceptsWallet: true,
  };
  if (context.partnerId) {
    onboardBody.partnerId = context.partnerId;
  }

  const onboard = await requestWithToken<ApiDriverOnboardingResponse>(
    driverToken,
    LINKS.v1.drivers.onboardingStart,
    { method: "POST", data: onboardBody }
  );

  const driverId = onboard.driver?.id;
  if (!driverId) {
    throw new Error("Onboarding chauffeur : identifiant manquant en réponse.");
  }

  const resolvedUserId = onboard.driver?.user_id ?? userId;

  if (context.partnerId) {
    try {
      await requestWithToken(driverToken, LINKS.v1.drivers.me, {
        method: "PATCH",
        data: { partnerId: context.partnerId },
      });
    } catch {
      // Rattachement partenaire via profil chauffeur indisponible — suite via members
    }

    if (resolvedUserId) {
      try {
        await apiClient.post(LINKS.v1.partners.members(context.partnerId), {
          userId: resolvedUserId,
          role: "DRIVER",
        });
      } catch {
        // Membre déjà lié ou route optionnelle
      }
    }
  }

  const detail = mapToDriverDetail(driverId, payload);
  if (resolvedUserId) detail.user_id = resolvedUserId;
  return detail;
}

export async function createDriverWithDocumentsViaV1(
  payload: CreateDriverPayload,
  documents: DriverDocumentFile[],
  context: CreateDriverV1Context = {}
): Promise<DriverDetail> {
  const driver = await createDriverViaV1(payload, context);
  if (documents.length === 0) return driver;

  const partnerId = context.partnerId?.trim();
  if (!partnerId) {
    throw new Error(
      "Documents chauffeur : un partenaire (partnerId) est requis pour l'upload v1."
    );
  }

  await uploadDriverDocumentsForPartner(partnerId, String(driver.id), documents);
  return driver;
}
