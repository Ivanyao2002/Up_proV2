"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { setAuthCookie } from "@/core/auth/authCookie";
import { notificationService } from "@/core/http/notificationService";
import { authService, type LoginPayload } from "./auth.service";

const REDIRECT: Record<LoginPayload["portal"], string> = {
  admin: "/admin/dashboard",
  partner: "/partner/dashboard",
  franchise: "/franchise/dashboard",
};

export function useLoginMutation(portal: LoginPayload["portal"]) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (payload: Omit<LoginPayload, "portal">) =>
      authService.login({ ...payload, portal }),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      setAuthCookie();
      notificationService.success("Connexion réussie");
      router.push(REDIRECT[portal]);
    },
    onError: () => {
      notificationService.error("Email ou mot de passe incorrect");
    },
  });
}
