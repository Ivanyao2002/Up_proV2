/** Profil renvoyé par POST /v1/auth/login (Swagger — UpJunoo API). */

export type ApiUserType =
  | "ADMIN"
  | "PARTNER"
  | "FRANCHISE"
  | "DRIVER"
  | "CLIENT"
  | string;

export interface ApiAuthProfile {
  id: string;
  user_type: ApiUserType;
  account_type?: string;
  phone?: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  country_id?: string | null;
  city_id?: string | null;
  locale?: string | null;
  status?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAuthSessionPayload {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  user?: Record<string, unknown>;
}

export interface ApiAuthLoginResponse {
  status?: string;
  generatedAt?: string;
  role?: string;
  userType?: ApiUserType;
  permissions?: string[];
  session?: ApiAuthSessionPayload;
  user?: Record<string, unknown>;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  loginHint?: string;
  profile?: ApiAuthProfile;
  driver?: unknown;
  partner?: unknown;
  franchiseMember?: unknown;
  franchise?: unknown;
  access?: {
    partnerId?: string | null;
    franchiseId?: string | null;
  };
}

export interface ApiAuthLoginBody {
  email: string;
  password: string;
  role?: ApiUserType;
}

/** GET /v1/auth/me — même enveloppe que le login (sans tokens). */
export type ApiAuthMeResponse = Omit<
  ApiAuthLoginResponse,
  "session" | "accessToken" | "refreshToken" | "expiresIn"
>;
