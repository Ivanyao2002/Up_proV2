"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { CountryFlag } from "@/shared/ui/CountryFlag";
import { PhoneDialPrefix } from "@/shared/ui/PhoneDialPrefix";
import {
  buildInternationalPhone,
  fetchBootstrapFoundation,
} from "@/core/api/catalogLookup.service";
import { useLegacyAdminApi } from "@/core/api/v1AdminMode";
import { notificationService } from "@/core/http/notificationService";
import { franchisePartnersService } from "@/features/franchise/api/partners.service";
import type { CreatePartnerPayload } from "@/features/franchise/api/partners.service";
import { useFranchiseDetail } from "../api/franchiseDetail.queries";
import {
  useBootstrapCountries,
  useCountryCities,
  useFranchisesList,
} from "../api/franchises.queries";
import { buildPartnerCreateDocumentUploads } from "../api/partnerCreateDocuments.v1";
import {
  partnersService,
  type PartnerCreatePayload,
} from "../api/partners.service";
import {
  DEFAULT_PARTNER_TYPE,
  PARTNER_TYPE_OPTIONS,
  type PartnerType,
} from "../lib/partnerType";
import {
  DEFAULT_PARTNER_LEGAL_FORM,
  PARTNER_LEGAL_FORM_OPTIONS,
  type PartnerLegalForm,
} from "../lib/partnerLegalForm";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_MESSAGE,
} from "@/shared/lib/passwordPolicy";
import {
  EMPTY_PARTNER_CREATE_DOCUMENTS,
  PartnerCreateDocumentsSection,
  partnerCreateDocumentsComplete,
  type PartnerCreateDocumentsState,
} from "./PartnerCreateDocumentsSection";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2";
const labelClass = "text-sm font-medium text-foreground";

export interface PartnerCreateFormProps {
  mode: "admin" | "franchise";
  lockedFranchiseId?: string;
  backHref: string;
  onSuccess: (partnerId: string) => void;
}

export function PartnerCreateForm({
  mode,
  lockedFranchiseId,
  backHref,
  onSuccess,
}: PartnerCreateFormProps) {
  const isAdmin = mode === "admin";
  const legacy = useLegacyAdminApi();
  const locked = isAdmin && Boolean(lockedFranchiseId);

  const { data: lockedFranchise, isLoading: lockedFranchiseLoading } =
    useFranchiseDetail(lockedFranchiseId ?? "");
  const { data: franchises } = useFranchisesList();
  const { data: countries = [], isLoading: countriesLoading } =
    useBootstrapCountries(isAdmin && !legacy);

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
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
  const [legalForm, setLegalForm] = useState<PartnerLegalForm>(
    DEFAULT_PARTNER_LEGAL_FORM
  );
  const [managerFirstName, setManagerFirstName] = useState("");
  const [managerLastName, setManagerLastName] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [documents, setDocuments] =
    useState<PartnerCreateDocumentsState>(EMPTY_PARTNER_CREATE_DOCUMENTS);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedFranchise = useMemo(() => {
    if (!isAdmin || franchiseId === "") return null;
    return (franchises?.data ?? []).find((f) => String(f.id) === String(franchiseId)) ?? null;
  }, [franchiseId, franchises?.data, isAdmin]);

  const franchiseCityHint = useMemo(() => {
    const hint = locked ? lockedFranchise?.city : selectedFranchise?.city;
    if (!hint || hint === "—") return "";
    return hint.trim();
  }, [locked, lockedFranchise?.city, selectedFranchise?.city]);

  const { data: cities = [], isLoading: citiesLoading } = useCountryCities(
    countryCode,
    isAdmin && !legacy
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
    if (!isAdmin || legacy || !locked || !countries.length || !lockedFranchise?.country_id) {
      return;
    }
    const country = countries.find((item) => item.id === lockedFranchise.country_id);
    if (country?.code) setCountryCode(country.code);
  }, [isAdmin, legacy, locked, countries, lockedFranchise?.country_id]);

  useEffect(() => {
    if (!isAdmin || legacy || locked || !countries.length || countryCode) return;
    const ci = countries.find((c) => c.code === "CI");
    setCountryCode(ci?.code ?? countries[0]!.code);
  }, [countries, countryCode, isAdmin, legacy, locked]);

  useEffect(() => {
    if (!isAdmin || legacy || locked || !franchiseCityHint || countryCode) return;
    let cancelled = false;
    void (async () => {
      const foundation = await fetchBootstrapFoundation();
      if (cancelled) return;
      const normalized = franchiseCityHint.toLowerCase();
      const catalogCity =
        foundation.cities.find((item) => item.label.toLowerCase() === normalized) ??
        foundation.cities.find((item) =>
          item.label.toLowerCase().includes(normalized)
        );
      if (!catalogCity) return;
      const country = foundation.countries.find(
        (item) => item.id === catalogCity.country_id
      );
      if (country?.code) setCountryCode(country.code);
    })();
    return () => {
      cancelled = true;
    };
  }, [franchiseCityHint, countryCode, isAdmin, legacy, locked]);

  useEffect(() => {
    if (!isAdmin || legacy || !countryCode) return;
    setCityId("");
  }, [countryCode, isAdmin, legacy]);

  useEffect(() => {
    if (!isAdmin || legacy || !cities.length || cityId) return;
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
  }, [cities, cityId, franchiseCityHint, isAdmin, legacy, locked]);

  const validate = (): string[] => {
    const next: string[] = [];
    if (!name.trim()) {
      next.push(isAdmin ? "La raison sociale est requise." : "Le nom commercial est requis.");
    }
    if (isAdmin && franchiseId === "") next.push("Sélectionnez une franchise.");
    if (isAdmin) {
      if (legacy) {
        if (!city.trim()) next.push("La ville est requise.");
      } else if (!countryCode.trim()) {
        next.push("Sélectionnez un pays.");
      } else if (!cityId.trim()) {
        next.push("Sélectionnez une ville.");
      }
    } else if (!city.trim()) {
      next.push("La ville est requise.");
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.push("Un email valide est requis.");
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      next.push(PASSWORD_MIN_MESSAGE);
    }
    if (password !== passwordConfirm) {
      next.push("Les mots de passe ne correspondent pas.");
    }
    // Téléphone optionnel côté admin (ne bloque pas) ; requis côté self-service.
    if (!isAdmin && !phone.trim()) {
      next.push("Le téléphone est requis.");
    }
    if (isAdmin && commissionRate.trim()) {
      const rate = Number(commissionRate.replace(",", "."));
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        next.push("Le taux de commission doit être entre 0 et 100 %.");
      }
    }
    if (legalForm === "COMPANY") {
      if (!managerFirstName.trim()) next.push("Le prénom du gérant est requis.");
      if (!managerLastName.trim()) next.push("Le nom du gérant est requis.");
    }
    if (!partnerCreateDocumentsComplete(documents, legalForm)) {
      next.push(
        legalForm === "COMPANY"
          ? "Pour une société : pièce du gérant (recto/verso), registre de commerce, statuts et DFE sont obligatoires."
          : "Le recto et le verso de la pièce d'identité sont obligatoires."
      );
    }
    return next;
  };

  const submit = async () => {
    const next = validate();
    setErrors(next);
    if (next.length) return;

    const uploads = buildPartnerCreateDocumentUploads(documents, legalForm);
    const managerFields =
      legalForm === "COMPANY"
        ? {
            manager_first_name: managerFirstName.trim(),
            manager_last_name: managerLastName.trim(),
          }
        : {};
    setIsSubmitting(true);

    try {
      if (isAdmin) {
        const payload: PartnerCreatePayload = {
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
          legal_form: legalForm,
          ...managerFields,
          commission_rate: commissionRate.trim()
            ? Number(commissionRate.replace(",", "."))
            : undefined,
        };
        const partner = await partnersService.createWithDocuments(payload, uploads);
        notificationService.success(
          partner.portal_login_email
            ? `Partenaire créé. Connexion portail : ${partner.portal_login_email}`
            : "Partenaire créé avec succès"
        );
        onSuccess(String(partner.id));
        return;
      }

      const payload: CreatePartnerPayload = {
        name: name.trim(),
        trade_name: name.trim(),
        legal_name: legalName.trim() || name.trim(),
        contact_email: email.trim(),
        password,
        contact_phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        legal_form: legalForm,
        ...managerFields,
      };
      const partner = await franchisePartnersService.createWithDocuments(payload, uploads);
      notificationService.success(
        partner.portal_login_email
          ? `Partenaire créé. Connexion portail : ${partner.portal_login_email}`
          : "Partenaire créé avec succès"
      );
      onSuccess(String(partner.id));
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : "Création du partenaire impossible.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDisabled =
    isSubmitting ||
    !partnerCreateDocumentsComplete(documents, legalForm) ||
    (isAdmin &&
      locked &&
      lockedFranchiseLoading) ||
    (isAdmin &&
      !legacy &&
      (countriesLoading || !countryCode || citiesLoading || !cityId));

  return (
    <form
      className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {errors.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Informations générales</h2>

        <label className="block">
          <span className={labelClass}>
            {isAdmin ? "Raison sociale *" : "Nom commercial *"}
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="block">
          <span className={labelClass}>Forme juridique *</span>
          <select
            value={legalForm}
            onChange={(event) =>
              setLegalForm(event.target.value as PartnerLegalForm)
            }
            className={inputClass}
            required
          >
            {PARTNER_LEGAL_FORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            {
              PARTNER_LEGAL_FORM_OPTIONS.find((o) => o.value === legalForm)
                ?.hint
            }
          </span>
        </label>

        {legalForm === "COMPANY" ? (
          <fieldset className="space-y-4 rounded-lg border border-border bg-canvas/40 p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">
              Gérant / représentant légal
            </legend>
            <p className="text-xs text-muted">
              Personne physique qui dirige la société (distincte du compte de
              connexion au portail).
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Prénom du gérant *</span>
                <input
                  value={managerFirstName}
                  onChange={(event) => setManagerFirstName(event.target.value)}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className={labelClass}>Nom du gérant *</span>
                <input
                  value={managerLastName}
                  onChange={(event) => setManagerLastName(event.target.value)}
                  className={inputClass}
                  required
                />
              </label>
            </div>
          </fieldset>
        ) : null}

        {!isAdmin ? (
          <label className="block">
            <span className={labelClass}>Raison sociale</span>
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              className={inputClass}
              placeholder="Dénomination légale"
            />
          </label>
        ) : null}

        {isAdmin ? (
          <label className="block">
            <span className={labelClass}>Franchise *</span>
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
                onChange={(event) =>
                  setFranchiseId(event.target.value ? event.target.value : "")
                }
                className={inputClass}
                required
              >
                <option value="">— Choisir —</option>
                {(franchises?.data ?? []).map((franchise) => (
                  <option key={String(franchise.id)} value={String(franchise.id)}>
                    {franchise.name}
                  </option>
                ))}
              </select>
            )}
          </label>
        ) : null}

        {isAdmin && !legacy ? (
          <label className="block">
            <span className={labelClass}>Pays *</span>
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
                    : (selectedCountry?.label ?? "Pays de la franchise")}
                </span>
              </div>
            ) : (
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                disabled={countriesLoading || !countries.length}
                className={inputClass}
                required
              >
                <option value="">
                  {countriesLoading ? "Chargement des pays…" : "— Choisir un pays —"}
                </option>
                {countries.map((country) => (
                  <option key={country.id} value={country.code}>
                    {country.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ) : null}

        <label className="block">
          <span className={labelClass}>Ville *</span>
          {isAdmin && !legacy ? (
            <select
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
              disabled={!countryCode || citiesLoading || !cities.length}
              className={inputClass}
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
          ) : (
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Ex. Abidjan"
              className={inputClass}
              required
            />
          )}
        </label>

        {isAdmin ? (
          <>
            <label className="block">
              <span className={labelClass}>Type de partenaire *</span>
              <select
                value={partnerType}
                onChange={(event) => setPartnerType(event.target.value as PartnerType)}
                className={inputClass}
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
              <span className={labelClass}>Taux de commission (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={commissionRate}
                onChange={(event) => setCommissionRate(event.target.value)}
                placeholder="Optionnel"
                className={inputClass}
              />
            </label>
          </>
        ) : null}

        <label className="block">
          <span className={labelClass}>Adresse</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={inputClass}
          />
        </label>
      </section>

      <fieldset className="space-y-4 rounded-lg border border-border bg-canvas/40 p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          Accès portail partenaire
        </legend>
        <label className="block">
          <span className={labelClass}>Email de connexion *</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Mot de passe *</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={PASSWORD_MIN_LENGTH}
            className={inputClass}
            required
          />
        </label>
        <label className="block">
          <span className={labelClass}>Confirmer le mot de passe *</span>
          <input
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            className={inputClass}
            required
          />
        </label>
      </fieldset>

      <label className="block">
        <span className={labelClass}>{isAdmin ? "Téléphone" : "Téléphone *"}</span>
        {isAdmin && !legacy ? (
          <div className="mt-1 flex overflow-hidden rounded-lg border border-border ring-teal/30 focus-within:ring-2">
            <PhoneDialPrefix
              dialCode={dialCode}
              flagUrl={selectedCountry?.flag_url}
              countryCode={selectedCountry?.code ?? countryCode}
            />
            <input
              value={phoneLocal}
              onChange={(event) =>
                setPhoneLocal(event.target.value.replace(/[^\d\s]/g, ""))
              }
              placeholder="07 12 34 56 78"
              inputMode="tel"
              className="w-full px-3 py-2.5 text-sm outline-none"
            />
          </div>
        ) : (
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            placeholder="+225 …"
            className={inputClass}
            required={!isAdmin}
          />
        )}
      </label>

      <hr className="border-border" />

      <PartnerCreateDocumentsSection
        documents={documents}
        onChange={setDocuments}
        disabled={isSubmitting}
        legalForm={legalForm}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Link href={backHref}>
          <Button type="button" variant="secondary">
            Annuler
          </Button>
        </Link>
        <Button type="submit" disabled={submitDisabled}>
          {isSubmitting ? "Création…" : "Créer le partenaire"}
        </Button>
      </div>
    </form>
  );
}
