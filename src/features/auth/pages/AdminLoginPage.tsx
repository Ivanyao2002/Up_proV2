"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { AppLogo } from "@/shared/ui/AppLogo";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { useLoginMutation } from "../api/auth.mutations";

export function AdminLoginPage() {
  const [email, setEmail] = useState(
    process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech"
  );
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!"
  );
  const login = useLoginMutation("admin");

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas p-6">
      <ThemeToggle className="absolute right-6 top-6" />
      <div className="w-full max-w-md animate-fade-up rounded-hero border border-border bg-surface p-8 shadow-card">
        <div className="mb-8 text-center">
          <AppLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-heading">
            Connexion administrateur
          </h1>
          <p className="mt-2 text-sm text-muted">
            Portail plateforme · scope global
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate({ email, password });
          }}
        >
          <label className="block">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Mot de passe</span>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <Button
            type="submit"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? "Connexion…" : "Se connecter"}
          </Button>
          <p className="text-right">
            <Link href="/admin/forgot-password" className="text-xs text-teal hover:underline">
              Mot de passe oublié ?
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/login" className="text-teal hover:underline">
            ← Choisir un autre portail
          </Link>
        </p>
      </div>
    </div>
  );
}
