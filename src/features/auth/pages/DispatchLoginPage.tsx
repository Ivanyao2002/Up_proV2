"use client";

import { useState } from "react";
import { LoginFormLayout } from "../components/LoginFormLayout";
import { useLoginMutation } from "../api/auth.mutations";

export function DispatchLoginPage() {
  const [email, setEmail] = useState("aya.kone@upjunoo.ci");
  const [password, setPassword] = useState("demo");
  const login = useLoginMutation("dispatch");

  return (
    <LoginFormLayout
      title="Dispatch"
      subtitle="Assignation manuelle et console temps réel · zones assignées"
      tag="Exploitation"
      tagClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
      accentHex="#f43f5e"
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onSubmit={(e) => { e.preventDefault(); login.mutate({ email, password }); }}
      isPending={login.isPending}
      forgotHref={null}
    />
  );
}
