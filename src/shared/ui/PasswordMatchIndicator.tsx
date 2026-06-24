"use client";

import { PASSWORD_MIN_LENGTH } from "@/shared/lib/passwordPolicy";

const DEFAULT_MIN_LENGTH = PASSWORD_MIN_LENGTH;

function ruleTextClass(state: "idle" | "ok" | "fail") {
  if (state === "ok") return "text-teal-dark";
  if (state === "fail") return "text-red-600";
  return "text-muted";
}

function RuleDot({ state }: { state: "idle" | "ok" | "fail" }) {
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
        state === "ok"
          ? "bg-teal"
          : state === "fail"
            ? "bg-red-500"
            : "bg-border"
      }`}
      aria-hidden
    />
  );
}

export function isPasswordPairValid(
  password: string,
  confirm: string,
  minLength = DEFAULT_MIN_LENGTH
) {
  return password.length >= minLength && password === confirm && confirm.length > 0;
}

interface PasswordMatchIndicatorProps {
  password: string;
  confirm: string;
  minLength?: number;
  className?: string;
}

export function PasswordMatchIndicator({
  password,
  confirm,
  minLength = DEFAULT_MIN_LENGTH,
  className = "",
}: PasswordMatchIndicatorProps) {
  if (!password && !confirm) return null;

  const lengthState: "idle" | "ok" | "fail" =
    !password ? "idle" : password.length >= minLength ? "ok" : "fail";

  const matchState: "idle" | "ok" | "fail" =
    !confirm ? "idle" : password === confirm ? "ok" : "fail";

  return (
    <ul
      className={`space-y-0.5 ${className}`}
      role="status"
      aria-live="polite"
    >
      <li className={`flex items-center gap-2 text-xs ${ruleTextClass(lengthState)}`}>
        <RuleDot state={lengthState} />
        Au moins {minLength} caractères
      </li>
      <li className={`flex items-center gap-2 text-xs ${ruleTextClass(matchState)}`}>
        <RuleDot state={matchState} />
        Les mots de passe correspondent
      </li>
    </ul>
  );
}
