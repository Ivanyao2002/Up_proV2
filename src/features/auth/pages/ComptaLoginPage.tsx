"use client";

import { useState } from "react";
import { LoginFormLayout } from "../components/LoginFormLayout";
import { useLoginMutation } from "../api/auth.mutations";

export function ComptaLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLoginMutation("compta");

  return (
    <LoginFormLayout
      title="Comptabilité"
      subtitle="Journal, clôtures, réconciliation et exports"
      tag="Finance"
      tagClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      accentHex="#10b981"
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
