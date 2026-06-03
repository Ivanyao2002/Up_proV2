"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import { authService } from "../api/auth.service";
import { env } from "@/core/config/env";

type Portal = "admin" | "partner" | "franchise";

const PORTAL_LABELS: Record<Portal, string> = {
  admin: "administrateur",
  partner: "partenaire",
  franchise: "franchise",
};

const LOGIN_PATHS: Record<Portal, string> = {
  admin: "/admin/login",
  partner: "/partner/login",
  franchise: "/franchise/login",
};

interface ForgotPasswordPageProps {
  portal: Portal;
}

export function ForgotPasswordPage({ portal }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const request = useMutation({
    mutationFn: () => authService.forgotPassword(email, portal),
    onSuccess: () => {
      setSent(true);
      notificationService.success("Email de réinitialisation envoyé (mock)");
    },
    onError: () => notificationService.error("Envoi impossible"),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md animate-fade-up rounded-hero border border-border bg-surface p-8 shadow-card">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-teal">
            {env.appName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-muted">
            Portail {PORTAL_LABELS[portal]}
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted">
              Si un compte existe pour <strong className="text-navy">{email}</strong>, vous
              recevrez un lien de réinitialisation (simulation mock).
            </p>
            <Link href={LOGIN_PATHS[portal]}>
              <Button className="w-full">Retour à la connexion</Button>
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              request.mutate();
            }}
          >
            <label className="block">
              <span className="text-sm font-medium text-[#212529]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                required
              />
            </label>
            <Button type="submit" className="w-full" disabled={request.isPending}>
              {request.isPending ? "Envoi…" : "Envoyer le lien"}
            </Button>
          </form>
        )}

        {!sent && (
          <p className="mt-6 text-center text-xs text-muted">
            <Link href={LOGIN_PATHS[portal]} className="text-teal hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
