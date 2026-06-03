"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { useLoginMutation } from "../api/auth.mutations";
import { env } from "@/core/config/env";

export function FranchiseLoginPage() {
  const [email, setEmail] = useState("franchise@abidjansud.ci");
  const [password, setPassword] = useState("demo");
  const login = useLoginMutation("franchise");

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md animate-fade-up rounded-hero border border-border bg-surface p-8 shadow-card">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-teal">
            {env.appName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-navy">Connexion franchise</h1>
          <p className="mt-2 text-sm text-muted">Gestion du territoire · scope franchise</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate({ email, password });
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
          <label className="block">
            <span className="text-sm font-medium text-[#212529]">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Connexion…" : "Se connecter"}
          </Button>
          <p className="text-right">
            <Link href="/franchise/forgot-password" className="text-xs text-teal hover:underline">
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
