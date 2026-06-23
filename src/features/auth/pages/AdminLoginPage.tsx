"use client";

import { useState } from "react";
import { LoginFormLayout } from "../components/LoginFormLayout";
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
    <LoginFormLayout
      title="Administrateur"
      subtitle="Plateforme globale · ops, réseau, finance, paramétrage"
      tag="Siège"
      tagClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      accentHex="#3b82f6"
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onSubmit={(e) => { e.preventDefault(); login.mutate({ email, password }); }}
      isPending={login.isPending}
      forgotHref="/admin/forgot-password"
    />
  );
}
