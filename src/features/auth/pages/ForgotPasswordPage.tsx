"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/ui/Button";
import { AppLogo } from "@/shared/ui/AppLogo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { notificationService } from "@/core/http/notificationService";
import { authService } from "../api/auth.service";

type Portal = "admin" | "partner" | "franchise";

const PORTAL_CONFIG: Record<Portal, {
  title: string; tag: string; subtitle: string; loginPath: string; accentHex: string; tagClass: string;
}> = {
  admin: {
    title: "Administrateur",
    tag: "Siège",
    subtitle: "Plateforme globale · ops, réseau, finance, paramétrage",
    loginPath: "/admin/login",
    accentHex: "#3b82f6",
    tagClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  partner: {
    title: "Partenaire",
    tag: "Terrain",
    subtitle: "Gérez votre flotte et votre wallet cascade",
    loginPath: "/partner/login",
    accentHex: "#0ab39c",
    tagClass: "bg-teal/10 text-teal-dark",
  },
  franchise: {
    title: "Franchise",
    tag: "Terrain",
    subtitle: "Gestion du territoire, partenaires et bonus zone",
    loginPath: "/franchise/login",
    accentHex: "#0ab39c",
    tagClass: "bg-teal/10 text-teal-dark",
  },
};

interface ForgotPasswordPageProps {
  portal: Portal;
}

export function ForgotPasswordPage({ portal }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { title, tag, tagClass, subtitle, loginPath, accentHex } = PORTAL_CONFIG[portal];

  const request = useMutation({
    mutationFn: () => authService.forgotPassword(email, portal),
    onSuccess: () => {
      setSent(true);
      notificationService.success("Email de réinitialisation envoyé (mock)");
    },
    onError: () => notificationService.error("Envoi impossible"),
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-3xl"
        style={{ background: `radial-gradient(circle, ${accentHex}, transparent 60%)` }}
      />

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link
          href={loginPath}
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour à la connexion
        </Link>
        <ThemeToggle />
      </header>

      {/* Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10 pt-4">
        <div className="w-full max-w-[380px] animate-fade-up">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated">
            <div className="h-[3px] w-full" style={{ background: accentHex }} />

            <div className="px-8 py-8">
              <AppLogo size="md" className="mb-7" />

              <div className="mb-6">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tagClass}`}>
                  {tag}
                </span>
                <h1 className="mt-2 text-xl font-bold text-heading">{title}</h1>
                <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>
              </div>

              <div className="mb-6 h-px bg-border" />

              {sent ? (
                <div className="space-y-5 py-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 text-teal">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-heading">Email envoyé</p>
                    <p className="mt-1 text-sm text-muted">
                      Si un compte existe pour{" "}
                      <span className="font-medium text-foreground">{email}</span>,
                      vous recevrez un lien de réinitialisation.
                    </p>
                  </div>
                  <Link href={loginPath}>
                    <Button className="w-full">Retour à la connexion</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <p className="mb-1 text-[15px] font-semibold text-heading">Mot de passe oublié ?</p>
                  <p className="mb-5 text-sm text-muted">
                    Saisissez votre email — nous vous enverrons un lien de réinitialisation.
                  </p>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => { e.preventDefault(); request.mutate(); }}
                  >
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@example.com"
                        className="w-full rounded-xl border border-border bg-[var(--color-input-bg)] px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/50 ring-teal/30 transition-shadow focus:ring-2"
                        required
                      />
                    </div>
                    <Button type="submit" className="!mt-6 w-full" disabled={request.isPending}>
                      {request.isPending ? "Envoi…" : "Envoyer le lien"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-muted">
            © {new Date().getFullYear()} Up Junoo · Tous droits réservés
          </p>
        </div>
      </main>
    </div>
  );
}
