"use client";

import Link from "next/link";
import { AppLogo } from "@/shared/ui/AppLogo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { Button } from "@/shared/ui/Button";

interface LoginFormLayoutProps {
  title: string;
  subtitle: string;
  tag: string;
  tagClass: string;
  accentHex: string;
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  forgotHref?: string | null;
}

export function LoginFormLayout({
  title,
  subtitle,
  tag,
  tagClass,
  accentHex,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  isPending,
  forgotHref = "/admin/forgot-password",
}: LoginFormLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      {/* Subtle ambient glow matching portal accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.05] blur-3xl"
        style={{ background: `radial-gradient(circle, ${accentHex}, transparent 60%)` }}
      />

      {/* ── Top navigation bar ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Choisir un autre portail
        </Link>
        <ThemeToggle />
      </header>

      {/* ── Centered card ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-10 pt-4">
        <div className="w-full max-w-[380px] animate-fade-up">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated">

            {/* Colored accent stripe */}
            <div className="h-[3px] w-full" style={{ background: accentHex }} />

            <div className="px-8 py-8">
              {/* Logo */}
              <AppLogo size="md" className="mb-7" />

              {/* Portal identity */}
              <div className="mb-6">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tagClass}`}>
                  {tag}
                </span>
                <h1 className="mt-2 text-xl font-bold text-heading">{title}</h1>
                <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>
              </div>

              <div className="mb-6 h-px bg-border" />

              {/* Form */}
              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="vous@example.com"
                    className="w-full rounded-xl border border-border bg-[var(--color-input-bg)] px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/50 ring-teal/30 transition-shadow focus:ring-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Mot de passe
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="!mt-6 w-full" disabled={isPending}>
                  {isPending ? "Connexion…" : "Se connecter"}
                </Button>
              </form>

              {forgotHref && (
                <p className="mt-4 text-center">
                  <Link href={forgotHref} className="text-xs text-teal hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </p>
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
