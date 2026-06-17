"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import {
  buildInternationalPhone,
  extractLocalPhonePart,
} from "@/core/api/catalogLookup.service";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { useCatalogCountryForPartner } from "@/shared/hooks/useCatalogCountryForPartner";
import type { Partner } from "@/shared/types";
import { useFranchiseDetail } from "../api/franchiseDetail.queries";
import { usePartnerDetail } from "../api/partnerDetail.queries";
import {
  useCatalogCountries,
  useCountryCities,
} from "../api/franchises.queries";
import { useUpdatePartner } from "../api/partners.queries";
import {
  DEFAULT_PARTNER_TYPE,
  PARTNER_TYPE_OPTIONS,
  normalizePartnerType,
  type PartnerType,
} from "../lib/partnerType";

interface PartnerEditPageProps {
  partnerId: string;
}

export function PartnerEditPage({ partnerId }: PartnerEditPageProps) {
  const router = useRouter();
  const legacy = useLegacyAdminApi();
  const { data, isLoading, isError } = usePartnerDetail(partnerId);
  const { data: franchise } = useFranchiseDetail(
    data?.franchise_id ? String(data.franchise_id) : ""
  );
  const update = useUpdatePartner(partnerId);
  const { data: countries = [], isLoading: countriesLoading } =
    useCatalogCountries(!legacy);
  const { data: catalogCountry } = useCatalogCountryForPartner({
    franchiseCountryId: franchise?.country_id,
    cityId: data?.city_id,
    cityLabel: data?.city,
    enabled: !legacy && Boolean(data),
  });

  const [initialized, setInitialized] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [cityId, setCityId] = useState("");
  const [email, setEmail] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Partner["status"]>("pending");
  const [partnerType, setPartnerType] = useState<PartnerType>(DEFAULT_PARTNER_TYPE);
  const [commissionRate, setCommissionRate] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const { data: cities = [], isLoading: citiesLoading } = useCountryCities(
    countryCode,
    !legacy
  );

  useEffect(() => {
    if (!data || initialized) return;

    setName(data.name);
    setCity(data.city !== "—" ? data.city : "");
    setEmail(data.contact_email);
    setPhone(data.contact_phone);
    setAddress(data.address !== "—" ? data.address : "");
    setStatus(data.status);
    if (data.city_id) setCityId(data.city_id);
    setPartnerType(normalizePartnerType(data.partner_type) ?? DEFAULT_PARTNER_TYPE);
    setCommissionRate(
      data.commission_rate != null && !Number.isNaN(data.commission_rate)
        ? String(data.commission_rate)
        : ""
    );
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
    const rawPhone = data?.contact_phone;
    if (!rawPhone || rawPhone === "—") return;
    setPhoneLocal(extractLocalPhonePart(rawPhone, dialCode));
  }, [data?.contact_phone, dialCode, initialized, legacy, phoneLocal]);

  const submit = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("Le nom est requis.");
    if (legacy) {
      if (!city.trim()) next.push("La ville est requise.");
    } else {
      if (!countryCode.trim()) next.push("Sélectionnez un pays.");
      if (!cityId.trim()) next.push("Sélectionnez une ville.");
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.push("Un email valide est requis.");
    }
    if (commissionRate.trim()) {
      const rate = Number(commissionRate.replace(",", "."));
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        next.push("Le taux de commission doit être entre 0 et 100 %.");
      }
    }
    setErrors(next);
    if (next.length) return;

    update.mutate(
      {
        name: name.trim(),
        city: legacy ? city.trim() : (selectedCity?.label ?? ""),
        city_id: legacy ? undefined : cityId.trim(),
        contact_email: email.trim(),
        contact_phone: legacy
          ? phone.trim()
          : phoneLocal.trim()
            ? buildInternationalPhone(dialCode, phoneLocal)
            : "",
        address: address.trim() || undefined,
        status,
        partner_type: partnerType,
        commission_rate: commissionRate.trim()
          ? Number(commissionRate.replace(",", "."))
          : undefined,
      },
      {
        onSuccess: () => {
          router.push(`/admin/network/partners/${partnerId}`);
        },
      }
    );
  };

  if (isLoading || !initialized) {
    return (
      <DetailPageSkeleton
        title="Modifier le partenaire"
        breadcrumb={["Admin", "Réseau", "Partenaires"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Partenaire introuvable.{" "}
        <Link href="/admin/network/partners" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title={`Modifier — ${data.name}`}
        breadcrumb={["Admin", "Réseau", "Partenaires", data.name, "Modifier"]}
      />
      <p className="mb-6 text-sm">
        <Link
          href={`/admin/network/partners/${partnerId}`}
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
          <span className="text-sm font-medium">Raison sociale</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Franchise</span>
          <div className="mt-1 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted">
            {data.franchise_name || "—"}
          </div>
          <p className="mt-1 text-xs text-muted">
            La franchise n&apos;est pas modifiable après création.
          </p>
        </label>

        {!legacy && (
          <label className="block">
            <span className="text-sm font-medium">Pays</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
              <CountryFlag
                flagUrl={selectedCountry?.flag_url}
                countryCode={selectedCountry?.code ?? countryCode}
                size={22}
              />
              <select
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  setCityId("");
                }}
                disabled={countriesLoading || !countries.length}
                className="w-full bg-transparent text-sm outline-none"
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
            </div>
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium">Ville</span>
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
          <span className="text-sm font-medium">Type de partenaire</span>
          <select
            value={partnerType}
            onChange={(e) => setPartnerType(e.target.value as PartnerType)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          >
            {PARTNER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Taux de commission (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            placeholder="Optionnel"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Téléphone</span>
          {legacy ? (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 …"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
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
                placeholder="07 12 34 56 78"
                inputMode="tel"
                className="w-full px-3 py-2.5 text-sm outline-none"
              />
            </div>
          )}
        </label>

        <label className="block">
          <span className="text-sm font-medium">Adresse</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Statut</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Partner["status"])}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
          </select>
          {/* <p className="mt-1 text-xs text-muted">
            Le changement de statut peut ne pas être appliqué par l&apos;API
            (demande PA-STATUS-01).
          </p> */}
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/admin/network/partners/${partnerId}`)}
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
