import type { AuthSession, PortalRole, Scope, User } from "@/shared/types";
import type {
  ApiAuthLoginResponse,
  ApiAuthMeResponse,
  ApiUserType,
} from "./auth.types";
import { ADMIN_BACKOFFICE_PERMISSIONS } from "./auth.permissions";

const PORTAL_BY_USER_TYPE: Record<string, PortalRole> = {
  ADMIN: "admin",
  ACCOUNTANT: "compta",
  PARTNER: "partner",
  FRANCHISE: "franchise",
  DRIVER: "dispatch",
  CLIENT: "admin",
};

const SCOPE_BY_PORTAL: Record<PortalRole, Scope> = {
  admin: "platform",
  compta: "accountant",
  franchise: "franchise",
  partner: "owner",
  dispatch: "platform",
};

function resolvePortal(
  expectedPortal: PortalRole,
  userType?: ApiUserType
): PortalRole {
  if (!userType) return expectedPortal;
  const mapped = PORTAL_BY_USER_TYPE[String(userType).toUpperCase()];
  return mapped ?? expectedPortal;
}

function defaultPermissions(portal: PortalRole): string[] {
  switch (portal) {
    case "admin":
      return ADMIN_BACKOFFICE_PERMISSIONS;
    case "compta":
      return [
        "finance.transactions.view",
        "finance.ledger.view",
        "finance.wallets.view",
        "finance.commissions.view",
        "finance.reconciliation.view",
        "accounting.export",
        "accounting.reverse",
        "accounting.periods.close",
        "accounting.periods.lock",
        "accounting.entries.classify",
      ];
    case "partner":
      return [
        "ops.dashboard.view",
        "ops.trips.view",
        "ops.map.view",
        "fleet.drivers.view",
        "finance.wallets.view",
      ];
    case "franchise":
      return [
        "ops.dashboard.view",
        "ops.map.view",
        "ops.trips.view",
        "ops.dispatch.view",
        "network.partners.view",
        "fleet.drivers.view",
        "fleet.kyc.approve",
        "finance.wallets.view",
      ];
    case "dispatch":
      return ["ops.dispatch.view", "ops.trips.view", "ops.map.view"];
    default:
      return [];
  }
}

function extractAccessToken(data: ApiAuthLoginResponse): string {
  const token =
    data.accessToken ??
    data.session?.access_token ??
    "";
  if (!token) {
    throw new Error("Réponse auth invalide : access_token manquant");
  }
  return token;
}

function extractRefreshToken(data: ApiAuthLoginResponse): string | null {
  return (
    data.refreshToken ??
    data.session?.refresh_token ??
    null
  );
}

type ApiAuthUserPayload = Pick<
  ApiAuthLoginResponse,
  "profile" | "user" | "userType" | "role" | "franchiseMember" | "partner" | "franchise" | "permissions"
> & { scope?: string };

function readScopedId(
  payload: Record<string, unknown> | undefined,
  keys: string[]
): string | undefined {
  if (!payload) return undefined;
  for (const key of keys) {
    const value = payload[key];
    if (value != null && String(value).trim()) return String(value);
  }
  return undefined;
}

function extractFranchiseId(data: ApiAuthUserPayload): string | undefined {
  const member = data.franchiseMember as Record<string, unknown> | undefined;
  const franchise = data.franchise as Record<string, unknown> | undefined;
  return (
    readScopedId(member, ["franchise_id", "franchiseId", "id"]) ??
    readScopedId(franchise, ["id"])
  );
}

function extractOwnerId(data: ApiAuthUserPayload): string | undefined {
  const partner = data.partner as Record<string, unknown> | undefined;
  const access = (data as { access?: Record<string, unknown> }).access;
  return (
    readScopedId(partner, ["id", "partner_id", "partnerId"]) ??
    readScopedId(access, ["partnerId", "partner_id"])
  );
}

function resolveScope(portal: PortalRole, apiScope?: string): Scope {
  if (apiScope === "accountant") return "accountant";
  return SCOPE_BY_PORTAL[portal];
}

function resolvePermissions(portal: PortalRole, apiPermissions: string[]): string[] {
  const defaults = defaultPermissions(portal);
  // Admin back-office : catalogue front complet (l'API peut renvoyer un sous-ensemble).
  if (portal === "admin") return defaults;
  return apiPermissions.length > 0 ? apiPermissions : defaults;
}

function buildUserFromApi(
  data: ApiAuthUserPayload,
  expectedPortal: PortalRole
): User {
  const userType = data.userType ?? data.profile?.user_type ?? data.role;
  const portal = resolvePortal(expectedPortal, userType);

  if (userType) {
    const mapped = PORTAL_BY_USER_TYPE[String(userType).toUpperCase()];
    if (mapped && mapped !== expectedPortal) {
      throw new Error(
        "Ce compte n'est pas autorisé sur ce portail. Utilisez le portail correspondant."
      );
    }
  }

  const profile = data.profile;
  const email =
    profile?.email ??
    (data.user as { email?: string } | undefined)?.email ??
    "";

  const name =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    email;

  const franchiseId = extractFranchiseId(data);
  const ownerId = extractOwnerId(data);
  const apiPermissions = Array.isArray(data.permissions) ? data.permissions : [];

  return {
    id: profile?.id ?? "unknown",
    name,
    email,
    role: portal,
    scope: resolveScope(portal, data.scope),
    franchise_id: franchiseId as unknown as number | undefined,
    owner_id: ownerId as unknown as number | undefined,
    permissions: resolvePermissions(portal, apiPermissions),
  };
}

/** Mappe la réponse Swagger /v1/auth/login vers le modèle back-office. */
export function mapApiLoginToAuthSession(
  data: ApiAuthLoginResponse,
  expectedPortal: PortalRole
): AuthSession {
  return {
    token: extractAccessToken(data),
    refreshToken: extractRefreshToken(data),
    user: buildUserFromApi(data, expectedPortal),
  };
}

/** Mappe GET /v1/auth/me vers le modèle User. */
export function mapApiMeToUser(
  data: ApiAuthMeResponse,
  expectedPortal: PortalRole
): User {
  return buildUserFromApi(data, expectedPortal);
}
