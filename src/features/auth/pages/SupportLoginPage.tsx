"use client";

import { useState } from "react";
import { LoginFormLayout } from "../components/LoginFormLayout";
import { useLoginMutation } from "../api/auth.mutations";

export function SupportLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLoginMutation("support");

  return (
    <LoginFormLayout
      title="Support"
      subtitle="Réclamations, chat franchises et suivi des anomalies"
      tag="Support"
      tagClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      accentHex="#f59e0b"
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
