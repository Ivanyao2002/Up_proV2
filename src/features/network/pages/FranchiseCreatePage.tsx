"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import { buildInternationalPhone } from "@/core/api/catalogLookup.service";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import type { Franchise } from "@/shared/types";
import {
  useBootstrapCountries,
  useCountryCities,
  useCreateFranchise,
} from "../api/franchises.queries";

export function FranchiseCreatePage() {
  const router = useRouter();
  const legacy = useLegacyAdminApi();
  const create = useCreateFranchise();
  const { data: countries = [], isLoading: countriesLoading } =
    useBootstrapCountries(!legacy);

  const [name, setName] = useState("");
  const [city, setCity] = useState("Abidjan");
  const [countryCode, setCountryCode] = useState("");
  const [cityId, setCityId] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [status, setStatus] = useState<Franchise["status"]>("pending");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const { data: cities = [], isLoading: citiesLoading } = useCountryCities(
    countryCode,
    !legacy
  );

  useEffect(() => {
    if (legacy || !countries.length || countryCode) return;
    const ci = countries.find((c) => c.code === "CI");
    setCountryCode(ci?.code ?? countries[0]!.code);
  }, [countries, countryCode, legacy]);

  useEffect(() => {
    if (legacy || !countryCode) return;
    setCityId("");
  }, [countryCode, legacy]);

  useEffect(() => {
    if (legacy || !cities.length || cityId) return;
    setCityId(cities[0]!.id);
  }, [cities, cityId, legacy]);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode) ?? null,
    [countries, countryCode]
  );

  const selectedCity = useMemo(
    () => cities.find((item) => item.id === cityId) ?? null,
    [cities, cityId]
  );

  const dialCode = selectedCountry?.dial_code ?? "+225";

  const submit = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("Le nom est requis.");
    if (legacy) {
      if (!city.trim()) next.push("La ville est requise.");
      if (!contactPhone.trim()) next.push("Le téléphone est requis.");
    } else {
      if (!countryCode.trim()) next.push("Sélectionnez un pays.");
      if (!cityId.trim()) next.push("Sélectionnez une ville.");
      if (!phoneLocal.trim()) next.push("Le numéro de téléphone est requis.");
    }
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      next.push("Un email de contact valide est requis.");
    }
    if (adminPassword.length < 8) {
      next.push("Le mot de passe admin doit contenir au moins 8 caractères.");
    }
    if (adminPassword !== adminPasswordConfirm) {
      next.push("Les mots de passe ne correspondent pas.");
    }
    setErrors(next);
    if (next.length) return;

    const fullPhone = legacy
      ? contactPhone.trim()
      : buildInternationalPhone(dialCode, phoneLocal);

    create.mutate(
      {
        name: name.trim(),
        city: legacy ? city.trim() : (selectedCity?.label ?? ""),
        city_id: legacy ? undefined : cityId.trim(),
        country_code: legacy ? undefined : selectedCountry?.code,
        status,
        contact_email: contactEmail.trim(),
        contact_phone: fullPhone,
        admin_password: adminPassword,
        franchise_id: undefined,
      },
      {
        onSuccess: (data) => {
          router.push(`/admin/network/franchises/${data.id}`);
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouvelle franchise" breadcrumb={["Admin", "Réseau", "Franchises"]} />
      <p className="mb-6 text-sm">
        <Link href="/admin/network/franchises" className="text-teal hover:underline">
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
        <label className="block">
          <span className="text-sm font-medium">
            {legacy ? "Pays ou région" : "Nom de la franchise"}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              legacy
                ? "Ex. Côte d'Ivoire, Canada, Espace euro"
                : "Ex. UPJUNOO Togo"
            }
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>

        {!legacy && (
          <label className="block">
            <span className="text-sm font-medium">Pays</span>
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
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium">Siège (ville principale)</span>
          {legacy ? (
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex. Abidjan, Lomé, Paris"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          ) : (
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!countryCode || citiesLoading || !cities.length}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            >
              <option value="">
                {!countryCode
                  ? "— Choisir un pays d'abord —"
                  : citiesLoading
                    ? "Chargement des villes…"
                    : cities.length
                      ? "— Choisir une ville —"
                      : "Aucune ville pour ce pays"}
              </option>
              {cities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
          {/* {!legacy && countryCode && (
            <p className="mt-1 text-xs text-muted">
              Villes chargées via{" "}
              <code className="text-[11px]">
                GET /v1/catalog/countries/{countryCode}/cities
              </code>
            </p>
          )} */}
        </label>

        <label className="block">
          <span className="text-sm font-medium">Email contact</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Téléphone</span>
          {legacy ? (
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+225 …"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          ) : (
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
                required
              />
            </div>
          )}
          {!legacy && (
            <p className="mt-1 text-xs text-muted">
              Indicatif déduit du pays sélectionné — saisissez le numéro local uniquement.
            </p>
          )}
        </label>

        <fieldset className="space-y-4 rounded-lg border border-border bg-canvas/50 p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">
            Accès portail franchise
          </legend>
          <p className="text-xs text-muted">
            L&apos;email de contact servira d&apos;identifiant de connexion portail franchise.
            {legacy
              ? " Le mot de passe est transmis une seule fois à la création (mock)."
              : " Route API : POST /v1/admin/franchises."}
          </p>
          <label className="block">
            <span className="text-sm font-medium">Mot de passe admin</span>
            <input
              type="password"
              autoComplete="new-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              minLength={8}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Confirmer le mot de passe</span>
            <input
              type="password"
              autoComplete="new-password"
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium">Statut initial</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Franchise["status"])}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
          </select>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              create.isPending ||
              (!legacy &&
                (countriesLoading || !countryCode || citiesLoading || !cityId))
            }
          >
            {create.isPending
              ? "Création…"
              : legacy
                ? "Créer la franchise"
                : "Créer l'accès portail"}
          </Button>
        </div>
      </form>
    </div>
  );
}
