"use client";

import { useState } from "react";
import { LoginFormLayout } from "../components/LoginFormLayout";
import { useLoginMutation } from "../api/auth.mutations";

export function PartnerLoginPage() {
  const [email, setEmail] = useState("contact@cocodyexpress.ci");
  const [password, setPassword] = useState("demo");
  const login = useLoginMutation("partner");

  return (
    <LoginFormLayout
      title="Partenaire"
      subtitle="Gérez votre flotte et votre wallet cascade"
      tag="Terrain"
      tagClass="bg-teal/10 text-teal-dark"
      accentHex="#0ab39c"
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onSubmit={(e) => { e.preventDefault(); login.mutate({ email, password }); }}
      isPending={login.isPending}
      forgotHref="/partner/forgot-password"
    />
  );
}
