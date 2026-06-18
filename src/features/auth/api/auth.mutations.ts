"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { clearAuthCookie, setAuthCookie } from "@/core/auth/authCookie";
import { AppError, resolveUserFacingMessage } from "@/core/http/errorHandler";
import { notificationService } from "@/core/http/notificationService";
import { DASHBOARD_BY_PORTAL } from "@/core/auth/authRoutes";
import { readReturnUrlFromLocation } from "@/core/auth/returnUrl";
import { authService, type LoginPayload } from "./auth.service";

export function useLogoutMutation(loginPath: string) {
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearSession();
      clearAuthCookie();
      window.location.href = loginPath;
    },
  });
}

export function useLoginMutation(portal: LoginPayload["portal"]) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: Omit<LoginPayload, "portal">) =>
      authService.login({ ...payload, portal }),
    onSuccess: (data) => {
      if (data.user.role !== portal) {
        notificationService.error(
          "Ce compte n'est pas autorisé sur ce portail. Utilisez le portail correspondant."
        );
        return;
      }
      setSession(data.token, data.user, data.refreshToken);
      setAuthCookie();
      notificationService.success("Connexion réussie");
      const destination = readReturnUrlFromLocation(
        DASHBOARD_BY_PORTAL[portal],
        portal
      );
      router.push(destination);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof AppError
          ? resolveUserFacingMessage(error.code, error.message)
          : error instanceof Error
            ? resolveUserFacingMessage(undefined, error.message)
            : "Email ou mot de passe incorrect.";
      notificationService.error(message);
    },
  });
}
