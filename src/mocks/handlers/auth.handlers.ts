import { http, HttpResponse } from "msw";
import authSession from "../data/auth-session.json";
import authPartner from "../data/auth-partner.json";
import authFranchise from "../data/auth-franchise.json";

export const authHandlers = [
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
    return HttpResponse.json(
      { message: "Identifiants invalides" },
      { status: 401 }
    );
  }),

  http.get("*/api/v2/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    if (auth?.includes("mock-jwt-partner")) {
      return HttpResponse.json(authPartner.user);
    }
    if (auth?.includes("mock-jwt-franchise")) {
      return HttpResponse.json(authFranchise.user);
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
];
