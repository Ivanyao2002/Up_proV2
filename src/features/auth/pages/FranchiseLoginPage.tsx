"use client";

import { useState } from "react";
import { LoginFormLayout } from "../components/LoginFormLayout";
import { useLoginMutation } from "../api/auth.mutations";

export function FranchiseLoginPage() {
  const [email, setEmail] = useState("franchise@abidjansud.ci");
  const [password, setPassword] = useState("demo");
  const login = useLoginMutation("franchise");

  return (
    <LoginFormLayout
      title="Franchise"
      subtitle="Gestion du territoire, partenaires et bonus zone"
      tag="Terrain"
      tagClass="bg-teal/10 text-teal-dark"
      accentHex="#0ab39c"
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onSubmit={(e) => { e.preventDefault(); login.mutate({ email, password }); }}
      isPending={login.isPending}
      forgotHref="/franchise/forgot-password"
    />
  );
}
