import { http, HttpResponse, passthrough } from "msw";

/** Quand USE_REAL_AUTH=true, les endpoints auth passent au vrai backend. */
const USE_REAL_AUTH = process.env.NEXT_PUBLIC_USE_REAL_AUTH === "true";
import authSession from "../data/auth-session.json";
import authSupport from "../data/auth-support.json";
import authPartner from "../data/auth-partner.json";
import authFranchise from "../data/auth-franchise.json";
import authDispatch from "../data/auth-dispatch.json";

function v1LoginFromLegacy(portal: string) {
  if (portal === "admin") return authSession;
  if (portal === "partner") return authPartner;
  if (portal === "franchise") return authFranchise;
  if (portal === "dispatch") return authDispatch;
  return null;
}

/** Réponse Swagger-like pour tests MSW + USE_REAL_AUTH */
function toV1Shape(legacy: typeof authSession, userType: string) {
  return {
    status: "ok",
    generatedAt: new Date().toISOString(),
    role: userType,
    userType,
    session: {
      access_token: legacy.token,
      token_type: "bearer",
      expires_in: 3600,
    },
    accessToken: legacy.token,
    user: legacy.user,
    profile: {
      id: String(legacy.user.id),
      user_type: userType,
      email: legacy.user.email,
      first_name: legacy.user.name.split(" ")[0],
      last_name: legacy.user.name.split(" ").slice(1).join(" ") || "User",
      display_name: legacy.user.name,
      status: "active",
    },
  };
}

export const authHandlers = [
  http.post("*/v1/auth/login", async ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json({ message: "Email et mot de passe requis" }, { status: 422 });
    }
    const email = body.email.trim().toLowerCase();
    if (email === authPartner.user.email.toLowerCase()) {
      return HttpResponse.json(toV1Shape(authPartner, "PARTNER"));
    }
    if (email === authFranchise.user.email.toLowerCase()) {
      return HttpResponse.json(toV1Shape(authFranchise, "FRANCHISE"));
    }
    if (email === authDispatch.user.email.toLowerCase()) {
      return HttpResponse.json(toV1Shape(authDispatch, "DRIVER"));
    }
    if (email === authSupport.user.email.toLowerCase()) {
      return HttpResponse.json(toV1Shape(authSupport, "SUPPORT"));
    }
    return HttpResponse.json(toV1Shape(authSession, "ADMIN"));
  }),

  http.post("*/v1/auth/admin/login", async ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json({ message: "Email et mot de passe requis" }, { status: 422 });
    }
    return HttpResponse.json(toV1Shape(authSession, "ADMIN"));
  }),

  http.post("*/v1/auth/partner/login", async ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body?.email) {
      return HttpResponse.json({ message: "Email requis" }, { status: 422 });
    }
    return HttpResponse.json(toV1Shape(authPartner, "PARTNER"));
  }),

  http.post("*/v1/auth/franchise/login", async ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body?.email) {
      return HttpResponse.json({ message: "Email requis" }, { status: 422 });
    }
    return HttpResponse.json(toV1Shape(authFranchise, "FRANCHISE"));
  }),

  http.post("*/api/v2/auth/login", async ({ request }) => {
    const body = (await request.json()) as { portal?: string };
    if (body?.portal === "admin") {
      return HttpResponse.json(authSession);
    }
    if (body?.portal === "partner") {
      return HttpResponse.json(authPartner);
    }
    if (body?.portal === "franchise") {
      return HttpResponse.json(authFranchise);
    }
    if (body?.portal === "dispatch") {
      return HttpResponse.json(authDispatch);
    }
    return HttpResponse.json(
      { message: "Identifiants invalides" },
      { status: 401 }
    );
  }),

  http.get("*/v1/auth/me", ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: { code: "AUTH_REQUIRED", message: "Missing bearer token" } },
        { status: 401 }
      );
    }
    if (auth.includes("mock-jwt-partner")) {
      return HttpResponse.json(toV1Shape(authPartner, "PARTNER"));
    }
    if (auth.includes("mock-jwt-franchise")) {
      return HttpResponse.json(toV1Shape(authFranchise, "FRANCHISE"));
    }
    if (auth.includes("mock-jwt-dispatch")) {
      return HttpResponse.json(toV1Shape(authDispatch, "DRIVER"));
    }
    if (auth.includes("mock-jwt-support-agent")) {
      return HttpResponse.json(toV1Shape(authSupport, "SUPPORT"));
    }
    return HttpResponse.json(toV1Shape(authSession, "ADMIN"));
  }),

  http.post("*/v1/auth/logout", ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const auth = request.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: { code: "AUTH_REQUIRED", message: "Missing bearer token" } },
        { status: 401 }
      );
    }
    return HttpResponse.json({ status: "ok" });
  }),

  http.get("*/api/v2/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth?.includes("mock-jwt-partner")) {
      return HttpResponse.json(authPartner.user);
    }
    if (auth?.includes("mock-jwt-franchise")) {
      return HttpResponse.json(authFranchise.user);
    }
    if (auth?.includes("mock-jwt-dispatch")) {
      return HttpResponse.json(authDispatch.user);
    }
    return HttpResponse.json(authSession.user);
  }),

  http.post("*/api/v2/auth/logout", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v2/auth/forgot-password", async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email?.trim()) {
      return HttpResponse.json({ message: "Email requis" }, { status: 422 });
    }
    return HttpResponse.json({
      ok: true,
      message: "Si le compte existe, un email a été envoyé.",
    });
  }),

  http.post("*/v1/auth/forgot-password", async ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const body = (await request.json()) as { email?: string };
    if (!body.email?.trim()) {
      return HttpResponse.json({ message: "Email requis" }, { status: 422 });
    }
    return HttpResponse.json({ ok: true, message: "Si le compte existe, un email a été envoyé." });
  }),

  http.post("*/v1/auth/reset-password", async ({ request }) => {
    if (USE_REAL_AUTH) return passthrough();
    const body = (await request.json()) as { token?: string; new_password?: string };
    if (!body.token) {
      return HttpResponse.json({ message: "Token manquant ou invalide" }, { status: 400 });
    }
    if (!body.new_password || body.new_password.length < 8) {
      return HttpResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 422 });
    }
    return HttpResponse.json({ ok: true, message: "Mot de passe réinitialisé avec succès." });
  }),

  http.post("*/api/v2/auth/reset-password", async ({ request }) => {
    const body = (await request.json()) as { token?: string; new_password?: string };
    if (!body.token) {
      return HttpResponse.json({ message: "Token manquant ou invalide" }, { status: 400 });
    }
    if (!body.new_password || body.new_password.length < 8) {
      return HttpResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 422 });
    }
    return HttpResponse.json({ ok: true, message: "Mot de passe réinitialisé avec succès." });
  }),
];
