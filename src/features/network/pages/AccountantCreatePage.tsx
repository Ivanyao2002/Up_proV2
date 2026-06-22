"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buildInternationalPhone } from "@/core/api/catalogLookup.service";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordMatchIndicator } from "@/shared/ui/PasswordMatchIndicator";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import { useBootstrapCountries } from "../api/franchises.queries";
import { useCreateAccountant } from "../api/adminAccountants.queries";

const PORTAL_PASSWORD_MIN = 8;

export function AccountantCreatePage() {
  const router = useRouter();
  const create = useCreateAccountant();
  const { data: countries = [], isLoading: countriesLoading } = useBootstrapCountries(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!countries.length || countryCode) return;
    const ci = countries.find((c) => c.code === "CI");
    setCountryCode(ci?.code ?? countries[0]!.code);
  }, [countries, countryCode]);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode) ?? null,
    [countries, countryCode]
  );

  const dialCode = selectedCountry?.dial_code ?? "+225";

  const submit = () => {
    const next: string[] = [];
    if (!firstName.trim()) next.push("Le prénom est requis.");
    if (!lastName.trim()) next.push("Le nom est requis.");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.push("Un email valide est requis.");
    }
    if (!countryCode.trim()) next.push("Sélectionnez un pays.");
    if (password.length < PORTAL_PASSWORD_MIN) {
      next.push(`Le mot de passe doit contenir au moins ${PORTAL_PASSWORD_MIN} caractères.`);
    }
    if (password !== passwordConfirm) {
      next.push("Les mots de passe ne correspondent pas.");
    }
    setErrors(next);
    if (next.length) return;

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
          router.push("/admin/network/accountants");
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouveau comptable" breadcrumb={["Admin", "Réseau", "Comptables"]} />
      <p className="mb-6 text-sm">
        <Link href="/admin/network/accountants" className="text-teal hover:underline">
          ← Retour
        </Link>
      </p>

      {errors.length > 0 && (
        <ul className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Nom</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Pays géré</span>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={countriesLoading || !countries.length}
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
          <p className="mt-1 text-xs text-muted">Un seul comptable par pays.</p>
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
          <p className="mt-1 text-xs text-muted">
            Indicatif déduit du pays sélectionné — saisissez le numéro local uniquement.
          </p>
        </label>

        <fieldset className="space-y-4 rounded-lg border border-border bg-canvas/40 p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">
            Accès portail comptable
          </legend>
          <p className="text-xs text-muted">
            L&apos;email et le mot de passe permettent au comptable de se connecter sur le portail{" "}
            <code className="text-[11px]">/compta</code>.
          </p>
          <label className="block">
            <span className="text-sm font-medium">Email de connexion</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="compta.ci@upjunoo.com"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Mot de passe portail</span>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={PORTAL_PASSWORD_MIN}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Confirmer le mot de passe</span>
            <PasswordInput
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
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
            href="/admin/network/accountants"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            Annuler
          </Link>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création…" : "Créer le comptable"}
          </Button>
        </div>
      </form>
    </div>
  );
}
