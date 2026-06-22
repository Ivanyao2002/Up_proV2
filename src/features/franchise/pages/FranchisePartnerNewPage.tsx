"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { PasswordInput } from "@/shared/ui/PasswordInput";
import { PasswordMatchIndicator } from "@/shared/ui/PasswordMatchIndicator";
import { DEFAULT_PARTNER_COMMISSION_RATE_PERCENT } from "@/features/network/lib/partnerType";
import {
  useCatalogCountries,
  useCountryCities,
} from "@/features/network/api/franchises.queries";
import { notificationService } from "@/core/http/notificationService";
import { useCreateFranchisePartner } from "../api/partners.queries";
import type { CreatePartnerPayload } from "../api/partners.service";
import {
  uploadPartnerDocuments,
  PARTNER_COMPANY_DOCUMENT_TYPES,
  type PartnerDocumentUpload
} from "../api/partnerDocuments.service";

const EMPTY_FORM: CreatePartnerPayload = {
  name: "",
  trade_name: "",
  legal_name: "",
  contact_email: "",
  password: "",
  contact_phone: "",
  city: "",
  address: "",
  commission_rate: DEFAULT_PARTNER_COMMISSION_RATE_PERCENT,
  legal_form: "INDIVIDUAL",
  manager_first_name: "",
  manager_last_name: "",
  partner_type: "FLEET",
};

interface FilePreview {
  file: File;
  url: string;
}

function FileUploadField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: FilePreview | null;
  onChange: (v: FilePreview | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (value?.url) URL.revokeObjectURL(value.url);
    onChange({ file, url: URL.createObjectURL(file) });
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted/70">{hint}</p>}
      <div
        className="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-canvas transition-colors hover:border-teal/50 hover:bg-teal/5"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <>
            <img
              src={value.url}
              alt={label}
              className="max-h-28 max-w-full rounded object-contain"
            />
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-red-50 p-1 text-red-500 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                if (value.url) URL.revokeObjectURL(value.url);
                onChange(null);
              }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <svg className="h-8 w-8 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-xs text-muted">Cliquez ou glissez une image ici</span>
            <span className="text-xs text-muted/60">JPG, PNG — max 5 Mo</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export function FranchisePartnerNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreatePartnerPayload>(EMPTY_FORM);
  const [idFront, setIdFront] = useState<FilePreview | null>(null);
  const [idBack, setIdBack] = useState<FilePreview | null>(null);
  const [rcc, setRcc] = useState<FilePreview | null>(null);
  const [statutes, setStatutes] = useState<FilePreview | null>(null);
  const [dfe, setDfe] = useState<FilePreview | null>(null);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const createPartner = useCreateFranchisePartner();

  // Pays + ville depuis le catalogue → city_id (UUID) requis par POST /v1/partners.
  const [countryCode, setCountryCode] = useState("");
  const [cityId, setCityId] = useState("");
  const { data: countries = [], isLoading: countriesLoading } = useCatalogCountries();
  const { data: cities = [], isLoading: citiesLoading } = useCountryCities(countryCode);
  const selectedCity = useMemo(
    () => cities.find((c) => c.id === cityId) ?? null,
    [cities, cityId]
  );

  // Pays par défaut : Côte d'Ivoire (sinon premier pays disponible).
  useEffect(() => {
    if (!countries.length || countryCode) return;
    const ci = countries.find((c) => c.code === "CI");
    setCountryCode(ci?.code ?? countries[0]!.code);
  }, [countries, countryCode]);

  // Réinitialiser la ville quand le pays change.
  useEffect(() => {
    if (countryCode) setCityId("");
  }, [countryCode]);

  // Pré-sélectionner la première ville du pays chargé.
  useEffect(() => {
    if (!cities.length || cityId) return;
    setCityId(cities[0]!.id);
  }, [cities, cityId]);

  const field = (key: keyof CreatePartnerPayload) => ({
    value: (form[key] ?? "") as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setFormError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (form.password !== passwordConfirm) {
      setFormError("Les mots de passe ne correspondent pas.");
      return;
    }
    const rate = form.commission_rate;
    if (rate == null || Number.isNaN(rate) || rate < 0 || rate > 100) {
      setFormError("Le taux de commission doit être entre 0 et 100 %.");
      return;
    }
    if (!cityId) {
      setFormError("Sélectionnez une ville.");
      return;
    }
    // Validation des documents selon la forme juridique
    if (form.legal_form === "COMPANY") {
      if (!rcc || !statutes || !dfe || !idFront || !idBack) {
        setFormError("Tous les documents obligatoires doivent être fournis pour les personnes morales.");
        return;
      }
    }

    setFormError(null);

    // Construire le payload avec tous les champs requis (city_id = UUID catalogue).
    const payloadToSend: CreatePartnerPayload = {
      name: form.name,
      trade_name: form.trade_name,
      legal_name: form.legal_name,
      contact_email: form.contact_email,
      password: form.password,
      contact_phone: form.contact_phone,
      city: selectedCity?.label ?? form.city,
      city_id: cityId,
      address: form.address,
      commission_rate: form.commission_rate,
      legal_form: form.legal_form || "INDIVIDUAL",
      manager_first_name: form.manager_first_name,
      manager_last_name: form.manager_last_name,
      partner_type: form.partner_type || "FLEET",
    };

    createPartner.mutate(payloadToSend, {
      onSuccess: async (partner) => {
        // Si c'est une personne morale, uploader les documents
        if (form.legal_form === "COMPANY") {
          setIsUploading(true);
          setUploadProgress("Upload des documents en cours...");
          
          try {
            const documents: PartnerDocumentUpload[] = [];
            
            // Ajouter les documents selon les spécifications
            if (rcc?.file) {
              documents.push({
                file: rcc.file,
                documentTypeCode: PARTNER_COMPANY_DOCUMENT_TYPES.BUSINESS_REGISTRATION,
              });
            }
            
            if (statutes?.file) {
              documents.push({
                file: statutes.file,
                documentTypeCode: PARTNER_COMPANY_DOCUMENT_TYPES.COMPANY_STATUTES,
              });
            }
            
            if (dfe?.file) {
              documents.push({
                file: dfe.file,
                documentTypeCode: PARTNER_COMPANY_DOCUMENT_TYPES.TAX_REGISTRATION_DFE,
              });
            }
            
            // Pièce d'identité du gérant (recto et verso)
            if (idFront?.file) {
              documents.push({
                file: idFront.file,
                documentTypeCode: PARTNER_COMPANY_DOCUMENT_TYPES.MANAGER_ID_CARD,
              });
            }
            
            if (idBack?.file) {
              documents.push({
                file: idBack.file,
                documentTypeCode: PARTNER_COMPANY_DOCUMENT_TYPES.MANAGER_ID_CARD,
              });
            }
            
            // Upload tous les documents
            if (documents.length > 0) {
              await uploadPartnerDocuments(String(partner.id), documents);
              setUploadProgress("Documents uploadés avec succès !");
            }
            
            // Redirection après succès
            setTimeout(() => {
              router.push(`/franchise/partners/${partner.id}`);
            }, 1000);
            
          } catch (error) {
            // Le partenaire EST déjà créé. Le dépôt de documents depuis le portail franchise est
            // refusé côté backend (PARTNER_ACCESS_DENIED — contrat §5.4 : dépôt réservé au partenaire
            // self-service ou à l'admin). On ne perd pas le partenaire : on redirige vers sa fiche.
            const message = error instanceof Error ? error.message : String(error);
            notificationService.warning(
              `Partenaire créé, mais le dépôt des documents n'est pas autorisé depuis le portail franchise (${message}). Les pièces devront être ajoutées par le partenaire (self-service) ou un administrateur.`,
              { duration: 9000 }
            );
            router.push(`/franchise/partners/${partner.id}`);
          }
        } else {
          // Personne physique : redirection directe
          router.push(`/franchise/partners/${partner.id}`);
        }
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        setFormError(`Erreur lors de la création du partenaire : ${message}`);
      },
    });
  };

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Nouveau partenaire"
          breadcrumb={["Franchise", "Partenaires", "Nouveau"]}
        />
        <Link href="/franchise/partners" className="mt-1 inline-flex items-center gap-1 text-sm text-teal hover:underline">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          {formError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}
          
          {isUploading && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <span>{uploadProgress}</span>
              </div>
            </div>
          )}

          {/* Étape 1 — Forme juridique (au choix) */}
          <h2 className="mb-1 text-sm font-semibold text-foreground">Forme juridique *</h2>
          <p className="mb-4 text-xs text-muted">
            Sélectionnez le type de partenaire à enregistrer.
          </p>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {(["INDIVIDUAL", "COMPANY"] as const).map((value) => {
              const active = form.legal_form === value;
              const meta =
                value === "INDIVIDUAL"
                  ? {
                      title: "Personne physique",
                      desc: "Entrepreneur individuel — aucun document obligatoire.",
                    }
                  : {
                      title: "Personne morale",
                      desc: "Société (SARL, SA…) — gérant + 4 documents requis.",
                    };
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setForm((f) => ({ ...f, legal_form: value }))}
                  className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                    active
                      ? "border-teal bg-teal/5 ring-1 ring-teal/30"
                      : "border-border bg-canvas hover:border-teal/40 hover:bg-teal/5"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-teal text-white" : "bg-muted/15 text-muted"
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      {value === "INDIVIDUAL" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      )}
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{meta.title}</span>
                      {active && (
                        <svg className="h-4 w-4 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{meta.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <hr className="mb-6 border-border" />

          {/* Infos générales */}
          <h2 className="mb-4 text-sm font-semibold text-foreground">Informations générales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Nom commercial *</label>
              <input
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Ex : Transport Express"
                {...field("name")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Type de partenaire *</label>
              <select
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                value={form.partner_type}
                onChange={(e) => setForm((f) => ({ ...f, partner_type: e.target.value as "FLEET" | "FREIGHT" | "RENTAL" }))}
              >
                <option value="FLEET">Flotte (transport de personnes)</option>
                <option value="FREIGHT">Fret (transport de marchandises)</option>
                <option value="RENTAL">Location (véhicules)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Raison sociale</label>
              <input
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Dénomination légale"
                {...field("legal_name")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Email de connexion *</label>
              <input
                required
                type="email"
                autoComplete="username"
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="contact@partenaire.com"
                {...field("contact_email")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Mot de passe *</label>
              <PasswordInput
                required
                autoComplete="new-password"
                minLength={6}
                className="bg-canvas"
                placeholder="Min. 6 caractères"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Confirmer le mot de passe *</label>
              <PasswordInput
                required
                autoComplete="new-password"
                className="bg-canvas"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <PasswordMatchIndicator
                className="mt-1"
                password={form.password}
                confirm={passwordConfirm}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Taux de commission (%) *</label>
              <input
                required
                type="number"
                min={0}
                max={100}
                step="0.01"
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder={`Défaut ${DEFAULT_PARTNER_COMMISSION_RATE_PERCENT} %`}
                value={form.commission_rate ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    commission_rate:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value.replace(",", ".")),
                  }))
                }
              />
              <p className="mt-1 text-xs text-muted/70">
                Valeur par défaut : {DEFAULT_PARTNER_COMMISSION_RATE_PERCENT} %.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Téléphone *</label>
              <input
                required
                type="tel"
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="07 12 34 56 78"
                {...field("contact_phone")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Pays *</label>
              <select
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={countriesLoading || !countries.length}
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
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Ville *</label>
              <select
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                disabled={!countryCode || citiesLoading || !cities.length}
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
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Adresse</label>
              <input
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Rue, quartier…"
                {...field("address")}
              />
            </div>
          </div>

          {/* Section Gérant - conditionnelle */}
          {form.legal_form === "COMPANY" && (
            <>
              <hr className="my-6 border-border" />
              <h2 className="mb-4 text-sm font-semibold text-foreground">Informations du gérant</h2>
              <p className="mb-4 text-xs text-muted">
                Personne physique représentant la personne morale (requis pour les sociétés).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Prénom du gérant</label>
                  <input
                    className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                    placeholder="Prénom"
                    value={form.manager_first_name || ""}
                    onChange={(e) => setForm((f) => ({ ...f, manager_first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Nom du gérant</label>
                  <input
                    className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                    placeholder="Nom"
                    value={form.manager_last_name || ""}
                    onChange={(e) => setForm((f) => ({ ...f, manager_last_name: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}

          <hr className="my-6 border-border" />

          {/* Documents selon forme juridique */}
          {form.legal_form === "INDIVIDUAL" ? (
            <>
              {/* Personne physique - aucun document obligatoire */}
              <h2 className="mb-4 text-sm font-semibold text-foreground">Documents</h2>
              <p className="mb-4 text-xs text-muted">
                Aucun document obligatoire pour les personnes physiques.
              </p>
            </>
          ) : (
            <>
              {/* Personne morale - 4 documents obligatoires */}
              <h2 className="mb-4 text-sm font-semibold text-foreground">Documents obligatoires *</h2>
              <p className="mb-4 text-xs text-muted">
                Les 4 documents suivants sont requis pour les personnes morales.
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Registre de commerce (RCCM) *</h3>
                  <FileUploadField
                    label="Document RCCM"
                    hint="Extrait du registre de commerce"
                    value={rcc}
                    onChange={setRcc}
                  />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Statuts de la société *</h3>
                  <FileUploadField
                    label="Statuts"
                    hint="Statuts de la société"
                    value={statutes}
                    onChange={setStatutes}
                  />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Déclaration Fiscale d'Existence (DFE) *</h3>
                  <FileUploadField
                    label="Document DFE"
                    hint="Déclaration fiscale d'existence"
                    value={dfe}
                    onChange={setDfe}
                  />
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-foreground">Pièce d'identité du gérant *</h3>
                  <p className="mb-3 text-xs text-muted">CNI, passeport ou tout document officiel (recto et verso).</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FileUploadField
                      label="Recto *"
                      hint="Face avant de la pièce"
                      value={idFront}
                      onChange={setIdFront}
                    />
                    <FileUploadField
                      label="Verso *"
                      hint="Face arrière de la pièce"
                      value={idBack}
                      onChange={setIdBack}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <hr className="my-6 border-border" />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/franchise/partners">
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button
              type="submit"
              disabled={
                createPartner.isPending ||
                isUploading ||
                !cityId ||
                (form.legal_form === "COMPANY" && (!rcc || !statutes || !dfe || !idFront || !idBack))
              }
            >
              {createPartner.isPending ? "Création…" : 
               isUploading ? "Upload des documents..." : 
               "Créer le partenaire"}
            </Button>
          </div>

          {form.legal_form === "COMPANY" && (!rcc || !statutes || !dfe || !idFront || !idBack) && (
            <p className="mt-2 text-right text-xs text-amber-600">
              Tous les documents obligatoires doivent être fournis pour les personnes morales.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
