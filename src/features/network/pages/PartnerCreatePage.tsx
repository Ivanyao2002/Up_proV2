"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordMatchIndicator } from "@/shared/ui/PasswordMatchIndicator";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import {
  buildInternationalPhone,
  resolveCountryCodeFromCityLabel,
} from "@/core/api/catalogLookup.service";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { useFranchiseDetail } from "../api/franchiseDetail.queries";
import {
  useCatalogCountries,
  useCountryCities,
  useFranchisesList,
} from "../api/franchises.queries";
import { useCreatePartner } from "../api/partners.queries";
import {
  DEFAULT_PARTNER_TYPE,
  DEFAULT_PARTNER_COMMISSION_RATE_PERCENT,
  PARTNER_TYPE_OPTIONS,
  type PartnerType,
} from "../lib/partnerType";

interface PartnerCreatePageProps {
  /** Création depuis la fiche franchise — franchise verrouillée. */
  lockedFranchiseId?: string;
}

export function PartnerCreatePage({ lockedFranchiseId }: PartnerCreatePageProps) {
  const router = useRouter();
  const legacy = useLegacyAdminApi();
  const locked = Boolean(lockedFranchiseId);
  const { data: lockedFranchise, isLoading: lockedFranchiseLoading } =
    useFranchiseDetail(lockedFranchiseId ?? "");
  const { data: franchises } = useFranchisesList();
  const { data: countries = [], isLoading: countriesLoading } =
    useCatalogCountries(!legacy);
  const create = useCreatePartner();

  const [name, setName] = useState("");
  const [franchiseId, setFranchiseId] = useState<number | string | "">("");
  const [city, setCity] = useState("Abidjan");
  const [countryCode, setCountryCode] = useState("");
  const [cityId, setCityId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [partnerType, setPartnerType] = useState<PartnerType>(DEFAULT_PARTNER_TYPE);
  const [commissionRate, setCommissionRate] = useState(
    String(DEFAULT_PARTNER_COMMISSION_RATE_PERCENT)
  );
  const [errors, setErrors] = useState<string[]>([]);

  const selectedFranchise = useMemo(() => {
    if (franchiseId === "") return null;
    return (franchises?.data ?? []).find((f) => String(f.id) === String(franchiseId)) ?? null;
  }, [franchiseId, franchises?.data]);

  const franchiseCityHint = useMemo(() => {
    const hint = locked
      ? lockedFranchise?.city
      : selectedFranchise?.city;
    if (!hint || hint === "—") return "";
    return hint.trim();
  }, [locked, lockedFranchise?.city, selectedFranchise?.city]);

  const { data: cities = [], isLoading: citiesLoading } = useCountryCities(
    countryCode,
    !legacy
  );

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode) ?? null,
    [countries, countryCode]
  );

  const selectedCity = useMemo(
    () => cities.find((item) => item.id === cityId) ?? null,
    [cities, cityId]
  );

  const dialCode = selectedCountry?.dial_code ?? "+225";

  useEffect(() => {
    if (!locked || !lockedFranchiseId) return;
    setFranchiseId(lockedFranchiseId);
    if (legacy && lockedFranchise?.city && lockedFranchise.city !== "—") {
      setCity(lockedFranchise.city);
    }
  }, [locked, lockedFranchiseId, lockedFranchise?.city, legacy]);

  useEffect(() => {
    if (legacy || !locked || !countries.length || !lockedFranchise?.country_id) return;
    const country = countries.find((item) => item.id === lockedFranchise.country_id);
    if (country?.code) setCountryCode(country.code);
  }, [legacy, locked, countries, lockedFranchise?.country_id]);

  useEffect(() => {
    if (legacy || locked || !countries.length || countryCode) return;
    const ci = countries.find((c) => c.code === "CI");
    setCountryCode(ci?.code ?? countries[0]!.code);
  }, [countries, countryCode, legacy, locked]);

  useEffect(() => {
    if (legacy || locked || !franchiseCityHint || countryCode) return;
    let cancelled = false;
    void (async () => {
      const code = await resolveCountryCodeFromCityLabel(franchiseCityHint);
      if (cancelled || !code) return;
      setCountryCode(code);
    })();
    return () => {
      cancelled = true;
    };
  }, [franchiseCityHint, countryCode, legacy, locked]);

  useEffect(() => {
    if (legacy || !countryCode) return;
    setCityId("");
  }, [countryCode, legacy]);

  useEffect(() => {
    if (legacy || !cities.length || cityId) return;
    if (franchiseCityHint) {
      const normalized = franchiseCityHint.toLowerCase();
      const match =
        cities.find((item) => item.label.toLowerCase() === normalized) ??
        cities.find((item) => item.label.toLowerCase().includes(normalized));
      if (match) {
        setCityId(match.id);
        return;
      }
    }
    if (!locked) setCityId(cities[0]!.id);
  }, [cities, cityId, franchiseCityHint, legacy, locked]);

  const backHref = locked
    ? `/admin/network/franchises/${lockedFranchiseId}?tab=partners`
    : "/admin/network/partners";

  const submit = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("Le nom est requis.");
    if (franchiseId === "") next.push("Sélectionnez une franchise.");
    if (legacy) {
      if (!city.trim()) next.push("La ville est requise.");
    } else {
      if (!countryCode.trim()) next.push("Sélectionnez un pays.");
      if (!cityId.trim()) next.push("Sélectionnez une ville.");
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.push("Un email valide est requis.");
    }
    if (password.length < 6) {
      next.push("Le mot de passe doit contenir au moins 6 caractères.");
    }
    if (password !== passwordConfirm) {
      next.push("Les mots de passe ne correspondent pas.");
    }
    if (commissionRate.trim()) {
      const rate = Number(commissionRate.replace(",", "."));
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        next.push("Le taux de commission doit être entre 0 et 100 %.");
      }
    } else {
      next.push("Le taux de commission est requis.");
    }
    setErrors(next);
    if (next.length) return;

    create.mutate(
      {
        name: name.trim(),
        franchise_id: franchiseId,
        city: legacy ? city.trim() : (selectedCity?.label ?? ""),
        city_id: legacy ? undefined : cityId.trim(),
        country_code: legacy ? undefined : selectedCountry?.code,
        contact_email: email.trim(),
        password,
        contact_phone: legacy
          ? phone.trim()
          : phoneLocal.trim()
            ? buildInternationalPhone(dialCode, phoneLocal)
            : "",
        address: address.trim() || undefined,
        partner_type: partnerType,
        commission_rate: Number(commissionRate.replace(",", ".")),
      },
      {
        onSuccess: (data) => {
          router.push(`/admin/network/partners/${data.id}`);
        },
      }
    );
  };

  const breadcrumb = locked
    ? [
        "Admin",
        "Réseau",
        "Franchises",
        lockedFranchise?.name ?? "…",
        "Nouveau partenaire",
      ]
    : ["Admin", "Réseau", "Partenaires", "Nouveau"];

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouveau partenaire" breadcrumb={breadcrumb} />
      <p className="mb-6 text-sm">
        <Link href={backHref} className="text-teal hover:underline">
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
          {locked ? (
            <select
              value={String(franchiseId)}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted"
            >
              <option value={String(franchiseId)}>
                {lockedFranchiseLoading
                  ? "Chargement…"
                  : (lockedFranchise?.name ?? "Franchise")}
              </option>
            </select>
          ) : (
            <select
              value={franchiseId === "" ? "" : String(franchiseId)}
              onChange={(e) =>
                setFranchiseId(e.target.value ? e.target.value : "")
              }
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            >
              <option value="">— Choisir —</option>
              {(franchises?.data ?? []).map((f) => (
                <option key={String(f.id)} value={String(f.id)}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          {locked && (
            <p className="mt-1 text-xs text-muted">
              Franchise pré-sélectionnée depuis la fiche réseau.
            </p>
          )}
        </label>

        {!legacy && (
          <label className="block">
            <span className="text-sm font-medium">Pays</span>
            {locked ? (
              <div className="mt-1 flex cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted">
                <CountryFlag
                  flagUrl={selectedCountry?.flag_url}
                  countryCode={selectedCountry?.code ?? countryCode}
                  size={22}
                />
                <span>
                  {countriesLoading || lockedFranchiseLoading
                    ? "Chargement…"
                    : selectedCountry?.label ?? "Pays de la franchise"}
                </span>
              </div>
            ) : (
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
            )}
            {locked && (
              <p className="mt-1 text-xs text-muted">
                Pays de la franchise — non modifiable.
              </p>
            )}
          </label>
        )}

        <label className="block">
          <span className="text-sm font-medium">Ville</span>
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
                  ? locked
                    ? "Chargement du pays de la franchise…"
                    : "— Choisir un pays d'abord —"
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
          <p className="mt-1 text-xs text-muted">
            {PARTNER_TYPE_OPTIONS.find((o) => o.value === partnerType)?.hint}
          </p>
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
            placeholder={`Défaut ${DEFAULT_PARTNER_COMMISSION_RATE_PERCENT} %`}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
          />
          <p className="mt-1 text-xs text-muted">
            Valeur par défaut : {DEFAULT_PARTNER_COMMISSION_RATE_PERCENT} % (part partenaire sur la commission globale).
          </p>
        </label>

        <fieldset className="space-y-4 rounded-lg border border-border bg-canvas/40 p-4">
          <legend className="px-1 text-sm font-semibold text-foreground">
            Accès portail partenaire
          </legend>
          <p className="text-xs text-muted">
            L&apos;email et le mot de passe permettent au partenaire de se connecter sur{" "}
            <code className="text-[11px]">POST /v1/auth/partner/login</code>.
          </p>
          <label className="block">
            <span className="text-sm font-medium">Email de connexion</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Mot de passe</span>
            <PasswordInput
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
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
            />
          </label>
        </fieldset>

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
          {!legacy && (
            <p className="mt-1 text-xs text-muted">
              Indicatif déduit du pays sélectionné — saisissez le numéro local uniquement.
            </p>
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
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              create.isPending ||
              (locked && lockedFranchiseLoading) ||
              (!legacy &&
                (countriesLoading || !countryCode || citiesLoading || !cityId))
            }
          >
            {create.isPending ? "Création…" : "Créer le partenaire"}
          </Button>
        </div>
      </form>
    </div>
  );
}
