"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildInternationalPhone } from "@/core/api/catalogLookup.service";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordMatchIndicator } from "@/shared/ui/PasswordMatchIndicator";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import { useBootstrapCountries } from "../api/franchises.queries";
import { getAdminStaffConfig, type AdminStaffKind } from "../api/adminStaff.config";
import { useCreateStaff } from "../api/adminStaff.queries";

const PORTAL_PASSWORD_MIN = 8;

type StaffFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "countryCode"
  | "password"
  | "passwordConfirm";

type FieldErrors = Partial<Record<StaffFieldKey, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function StaffCreatePage({ kind }: { kind: AdminStaffKind }) {
  const config = getAdminStaffConfig(kind);
  const router = useRouter();
  const create = useCreateStaff(kind);
  const { data: countries = [], isLoading: countriesLoading } = useBootstrapCountries(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLSelectElement>(null);

  // #47 — autofocus sur le premier champ pertinent.
  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!countries.length || countryCode) return;
    const ci = countries.find((c) => c.code === "CI");
    setCountryCode(ci?.code ?? countries[0]!.code);
  }, [countries, countryCode]);

  const clearFieldError = (field: StaffFieldKey) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const validateEmailField = () => {
    const value = email.trim();
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (!value || !EMAIL_PATTERN.test(value)) {
        next.email = "Un email valide est requis.";
      } else {
        delete next.email;
      }
      return next;
    });
  };

  const validatePasswordField = () => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (password.length < PORTAL_PASSWORD_MIN) {
        next.password = `Le mot de passe doit contenir au moins ${PORTAL_PASSWORD_MIN} caractères.`;
      } else {
        delete next.password;
      }
      return next;
    });
  };

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode) ?? null,
    [countries, countryCode]
  );

  const dialCode = selectedCountry?.dial_code ?? "+225";

  const submit = () => {
    const fields: FieldErrors = {};
    if (!firstName.trim()) fields.firstName = "Le prénom est requis.";
    if (!lastName.trim()) fields.lastName = "Le nom est requis.";
    if (!email.trim() || !EMAIL_PATTERN.test(email)) {
      fields.email = "Un email valide est requis.";
    }
    if (!countryCode.trim()) fields.countryCode = "Sélectionnez un pays.";
    if (password.length < PORTAL_PASSWORD_MIN) {
      fields.password = `Le mot de passe doit contenir au moins ${PORTAL_PASSWORD_MIN} caractères.`;
    }
    if (password !== passwordConfirm) {
      fields.passwordConfirm = "Les mots de passe ne correspondent pas.";
    }

    setFieldErrors(fields);
    const next = Object.values(fields);
    setErrors(next);

    if (next.length) {
      // #42 — focus sur le premier champ invalide.
      const focusOrder: [StaffFieldKey, () => HTMLElement | null][] = [
        ["firstName", () => firstNameRef.current],
        ["lastName", () => lastNameRef.current],
        ["email", () => emailRef.current],
        ["countryCode", () => countryRef.current],
        ["password", () => document.getElementById("staff-password")],
        ["passwordConfirm", () => document.getElementById("staff-password-confirm")],
      ];
      for (const [key, getEl] of focusOrder) {
        if (fields[key]) {
          getEl()?.focus();
          break;
        }
      }
      return;
    }

    const fullPhone = phoneLocal.trim()
      ? buildInternationalPhone(dialCode, phoneLocal)
      : undefined;

    create.mutate(
      {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        countryCode: selectedCountry?.code ?? countryCode,
        countryId: selectedCountry?.id,
        phone: fullPhone,
      },
      {
        onSuccess: () => {
          router.push(config.listPath);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title={`Nouveau — ${config.titleSingular.toLowerCase()}`}
        breadcrumb={["Admin", "Réseau", config.titlePlural]}
      />
      <p className="mb-6 text-sm">
        <Link href={config.listPath} className="text-teal hover:underline">
          ← Retour à la liste
        </Link>
      </p>

      {errors.length > 0 && (
        <ul
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <form
        className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Prénom</span>
            <input
              ref={firstNameRef}
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError("firstName");
              }}
              aria-invalid={fieldErrors.firstName ? true : undefined}
              aria-describedby={fieldErrors.firstName ? "staff-firstName-error" : undefined}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
            {fieldErrors.firstName && (
              <p id="staff-firstName-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.firstName}
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nom</span>
            <input
              ref={lastNameRef}
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError("lastName");
              }}
              aria-invalid={fieldErrors.lastName ? true : undefined}
              aria-describedby={fieldErrors.lastName ? "staff-lastName-error" : undefined}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
            {fieldErrors.lastName && (
              <p id="staff-lastName-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.lastName}
              </p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Pays géré</span>
          <select
            ref={countryRef}
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value);
              clearFieldError("countryCode");
            }}
            disabled={countriesLoading || !countries.length}
            aria-invalid={fieldErrors.countryCode ? true : undefined}
            aria-describedby={fieldErrors.countryCode ? "staff-country-error" : undefined}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          >
            <option value="">
              {countriesLoading ? "Chargement des pays…" : "— Choisir un pays —"}
            </option>
            {countries.map((country) => (
              <option key={country.id} value={country.code}>
                {country.label} ({country.dial_code})
              </option>
            ))}
          </select>
          {fieldErrors.countryCode && (
            <p id="staff-country-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.countryCode}
            </p>
          )}
          <p className="mt-1 text-xs text-muted">{config.countryHint}</p>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Téléphone (optionnel)</span>
          <div className="mt-1 flex overflow-hidden rounded-lg border border-border ring-teal/30 focus-within:ring-2">
            <PhoneDialPrefix
              dialCode={dialCode}
              flagUrl={selectedCountry?.flag_url}
              countryCode={selectedCountry?.code ?? countryCode}
            />
            <input
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="07 12 34 56 78"
              inputMode="tel"
              className="w-full px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </label>

        <fieldset className="space-y-4 rounded-lg border border-border bg-canvas/40 p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">
            Accès portail {config.portalCode}
          </legend>
          <p className="text-xs text-muted">
            Connexion sur{" "}
            <code className="text-[11px]">{config.portalLoginPath}</code>
            {" — "}le champ <code className="text-[11px]">portal</code> est envoyé à l&apos;API
            lors du login.
          </p>
          <label className="block">
            <span className="text-sm font-medium">Email de connexion</span>
            <input
              ref={emailRef}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              onBlur={validateEmailField}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? "staff-email-error" : undefined}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
            {fieldErrors.email && (
              <p id="staff-email-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Mot de passe portail</span>
            <PasswordInput
              id="staff-password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              onBlur={validatePasswordField}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? "staff-password-error" : undefined}
              minLength={PORTAL_PASSWORD_MIN}
              required
            />
            {fieldErrors.password && (
              <p id="staff-password-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Confirmer le mot de passe</span>
            <PasswordInput
              id="staff-password-confirm"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                clearFieldError("passwordConfirm");
              }}
              aria-invalid={fieldErrors.passwordConfirm ? true : undefined}
              aria-describedby={
                fieldErrors.passwordConfirm ? "staff-password-confirm-error" : undefined
              }
              required
            />
            {fieldErrors.passwordConfirm && (
              <p id="staff-password-confirm-error" className="mt-1 text-xs text-red-600">
                {fieldErrors.passwordConfirm}
              </p>
            )}
            <PasswordMatchIndicator
              className="mt-1"
              password={password}
              confirm={passwordConfirm}
              minLength={PORTAL_PASSWORD_MIN}
            />
          </label>
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href={config.listPath}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            Annuler
          </Link>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création…" : `Créer le ${config.titleSingular.toLowerCase()}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
