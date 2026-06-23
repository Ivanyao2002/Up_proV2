"use client";

import { useState } from "react";
import { LoginFormLayout } from "../components/LoginFormLayout";
import { useLoginMutation } from "../api/auth.mutations";

export function ReportingLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLoginMutation("reporting");

  return (
    <LoginFormLayout
      title="Reporting"
      subtitle="Tableaux consolidés, exports et synthèses multi-services"
      tag="Reporting"
      tagClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      accentHex="#8b5cf6"
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
