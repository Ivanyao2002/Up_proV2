"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import {
  buildInternationalPhone,
  extractLocalPhonePart,
} from "@/core/api/catalogLookup.service";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { useCatalogCountryForPartner } from "@/shared/hooks/useCatalogCountryForPartner";
import type { Franchise } from "@/shared/types";
import { useFranchiseDetail } from "../api/franchiseDetail.queries";
import {
  useBootstrapCountries,
  useCountryCities,
  useUpdateFranchise,
} from "../api/franchises.queries";

interface FranchiseEditPageProps {
  franchiseId: string;
}

export function FranchiseEditPage({ franchiseId }: FranchiseEditPageProps) {
  const router = useRouter();
  const legacy = useLegacyAdminApi();
  const { data, isLoading, isError } = useFranchiseDetail(franchiseId);
  const update = useUpdateFranchise(franchiseId);
  const { data: countries = [], isLoading: countriesLoading } =
    useBootstrapCountries(!legacy);
  const { data: catalogCountry } = useCatalogCountryForPartner({
    franchiseCountryId: data?.country_id,
    cityLabel: data?.city,
    enabled: !legacy && Boolean(data),
  });

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [cityId, setCityId] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [status, setStatus] = useState<Franchise["status"]>("pending");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const { data: cities = [], isLoading: citiesLoading } = useCountryCities(
    countryCode,
    !legacy
  );

  useEffect(() => {
    if (!data || initialized) return;

    setName(data.name);
    setCity(data.city !== "—" ? data.city : "");
    setStatus(data.status);
    setContactEmail(data.contact_email !== "—" ? data.contact_email : "");
    setContactPhone(data.contact_phone !== "—" ? data.contact_phone : "");
    setInitialized(true);
  }, [data, initialized]);

  useEffect(() => {
    if (legacy || !catalogCountry?.code || countryCode) return;
    setCountryCode(catalogCountry.code);
  }, [catalogCountry, countryCode, legacy]);

  useEffect(() => {
    if (legacy || !cities.length || cityId || !data?.city || data.city === "—") {
      return;
    }
    const normalized = data.city.toLowerCase();
    const match =
      cities.find((item) => item.label.toLowerCase() === normalized) ??
      cities.find((item) => item.label.toLowerCase().includes(normalized));
    if (match) setCityId(match.id);
  }, [cities, cityId, data?.city, legacy]);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode) ?? catalogCountry,
    [countries, countryCode, catalogCountry]
  );

  const selectedCity = useMemo(
    () => cities.find((item) => item.id === cityId) ?? null,
    [cities, cityId]
  );

  const dialCode = selectedCountry?.dial_code ?? "+225";

  useEffect(() => {
    if (legacy || !initialized || phoneLocal) return;
    const phone = data?.contact_phone;
    if (!phone || phone === "—") return;
    setPhoneLocal(extractLocalPhonePart(phone, dialCode));
  }, [data?.contact_phone, dialCode, initialized, legacy, phoneLocal]);

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
    setErrors(next);
    if (next.length) return;

    const fullPhone = legacy
      ? contactPhone.trim()
      : buildInternationalPhone(dialCode, phoneLocal);

    update.mutate(
      {
        name: name.trim(),
        city: legacy ? city.trim() : (selectedCity?.label ?? ""),
        city_id: legacy ? undefined : cityId.trim(),
        status,
        contact_email: contactEmail.trim(),
        contact_phone: fullPhone,
      },
      {
        onSuccess: () => {
          router.push(`/admin/network/franchises/${franchiseId}`);
        },
      }
    );
  };

  if (isLoading || !initialized) {
    return (
      <DetailPageSkeleton
        title="Modifier la franchise"
        breadcrumb={["Admin", "Réseau", "Franchises"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Franchise introuvable.{" "}
        <Link href="/admin/network/franchises" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title={`Modifier — ${data.name}`}
        breadcrumb={["Admin", "Réseau", "Franchises", data.name, "Modifier"]}
      />
      <p className="mb-6 text-sm">
        <Link
          href={`/admin/network/franchises/${franchiseId}`}
          className="text-teal hover:underline"
        >
          ← Retour à la fiche
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
          <span className="text-sm font-medium">Nom de la franchise</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>

        {!legacy && (
          <label className="block">
            <span className="text-sm font-medium">Pays</span>
            <select
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value);
                setCityId("");
              }}
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
                onChange={(e) =>
                  setPhoneLocal(e.target.value.replace(/[^\d\s]/g, ""))
                }
                inputMode="tel"
                className="w-full px-3 py-2.5 text-sm outline-none"
                required
              />
            </div>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium">Statut</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Franchise["status"])}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
          </select>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/admin/network/franchises/${franchiseId}`)}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              update.isPending ||
              (!legacy &&
                (countriesLoading || !countryCode || citiesLoading || !cityId))
            }
          >
            {update.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
