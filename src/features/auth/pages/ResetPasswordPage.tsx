"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/ui/Button";
import { AppLogo } from "@/shared/ui/AppLogo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordMatchIndicator, isPasswordPairValid } from "@/shared/ui/PasswordMatchIndicator";
import { notificationService } from "@/core/http/notificationService";
import { authService } from "../api/auth.service";

type Portal = "admin" | "partner" | "franchise";

const PORTAL_CONFIG: Record<Portal, {
  title: string; tag: string; tagClass: string; accentHex: string;
  loginPath: string; forgotPath: string;
}> = {
  admin: {
    title: "Administrateur", tag: "Siège",
    tagClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    accentHex: "#3b82f6",
    loginPath: "/admin/login", forgotPath: "/admin/forgot-password",
  },
  partner: {
    title: "Partenaire", tag: "Terrain",
    tagClass: "bg-teal/10 text-teal-dark",
    accentHex: "#0ab39c",
    loginPath: "/partner/login", forgotPath: "/partner/forgot-password",
  },
  franchise: {
    title: "Franchise", tag: "Terrain",
    tagClass: "bg-teal/10 text-teal-dark",
    accentHex: "#0ab39c",
    loginPath: "/franchise/login", forgotPath: "/franchise/forgot-password",
  },
};

interface ResetPasswordPageProps {
  portal: Portal;
}

export function ResetPasswordPage({ portal }: ResetPasswordPageProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const { title, tag, tagClass, accentHex, loginPath, forgotPath } = PORTAL_CONFIG[portal];

  const reset = useMutation({
    mutationFn: () => authService.resetPassword(token!, password),
    onSuccess: () => {
      setDone(true);
      notificationService.success("Mot de passe réinitialisé avec succès");
    },
    onError: () => notificationService.error("Lien invalide ou expiré"),
  });

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-3xl"
        style={{ background: `radial-gradient(circle, ${accentHex}, transparent 60%)` }}
      />

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
              </div>

              <div className="mb-6 h-px bg-border" />

              {/* Token absent ou invalide */}
              {!token && (
                <div className="space-y-4 py-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 text-rose-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-heading">Lien invalide</p>
                    <p className="mt-1 text-sm text-muted">
                      Ce lien est invalide ou a expiré. Demandez un nouveau lien de réinitialisation.
                    </p>
                  </div>
                  <Link href={forgotPath}>
                    <Button className="w-full">Demander un nouveau lien</Button>
                  </Link>
                </div>
              )}

              {/* Succès */}
              {token && done && (
                <div className="space-y-5 py-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 text-teal">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-heading">Mot de passe mis à jour</p>
                    <p className="mt-1 text-sm text-muted">
                      Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.
                    </p>
                  </div>
                  <Link href={loginPath}>
                    <Button className="w-full">Se connecter</Button>
                  </Link>
                </div>
              )}

              {/* Formulaire */}
              {token && !done && (
                <>
                  <p className="mb-1 text-[15px] font-semibold text-heading">Nouveau mot de passe</p>
                  <p className="mb-5 text-sm text-muted">
                    Choisissez un nouveau mot de passe sécurisé d&apos;au moins 8 caractères.
                  </p>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => { e.preventDefault(); reset.mutate(); }}
                  >
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Nouveau mot de passe
                      </label>
                      <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Confirmer le mot de passe
                      </label>
                      <PasswordInput
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                      />
                      <PasswordMatchIndicator
                        password={password}
                        confirm={confirm}
                        minLength={8}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="!mt-6 w-full"
                      disabled={reset.isPending || !isPasswordPairValid(password, confirm, 8)}
                    >
                      {reset.isPending ? "Mise à jour…" : "Réinitialiser le mot de passe"}
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
