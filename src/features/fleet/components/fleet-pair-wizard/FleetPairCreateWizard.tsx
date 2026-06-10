"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/Button";
import { WizardStepper } from "@/shared/ui/WizardStepper";
import { FieldSourceBadge, fieldInputClass } from "@/shared/ui/FieldSourceBadge";
import {
  EMPTY_DRIVER,
  VehicleCreateDriverSection,
} from "@/features/partner/components/VehicleCreateDriverSection";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import type { CatalogCountry } from "@/core/api/catalogLookup.service";
import type { Partner, PartnerDetail, VehicleCategory } from "@/shared/types";
import type { FieldProvenance, MergedExtraction } from "@/features/fleet/lib/documentExtraction.types";
import { matchCatalogCode } from "@/features/fleet/lib/catalogMatch";
import {
  driverUploadsFromWizard,
  flattenDriverDocuments,
  flattenVehiclePieces,
  vehicleUploadsFromWizard,
} from "@/shared/types/documentUpload";
import {
  isDriverComplete,
  vehicleCreateSubmitLabel,
} from "@/features/fleet/lib/vehicleCreateForm";
import { useVehicleBrandModelsCatalog } from "@/features/fleet/api/vehicles.queries";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import type { VehiclePieceFile } from "@/features/partner/components/VehicleCreatePiecesSection";
import {
  getWizardStepIndex,
  getWizardStepsForMode,
  type CreationMode,
  type WizardStepId,
} from "./wizardSteps";
import { ModeStep } from "./ModeStep";
import {
  DocumentsStep,
  EMPTY_WIZARD_DOCUMENTS,
  type WizardDocumentsState,
} from "./DocumentsStep";
import { ExtractionStep } from "./ExtractionStep";

const PARTNER_CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "taxi", label: "Taxi" },
  { value: "delivery", label: "Livraison" },
  { value: "van", label: "Utilitaire" },
  { value: "premium", label: "Premium" },
];

export interface AdminFleetPairSubmitPayload {
  data: {
    partnerId: string;
    categoryCode: string;
    brandCode: string;
    modelCode: string;
    colorCode: string;
    manufactureYear: number;
    seatsCount: number;
    plateNumber?: string;
  };
  pieces: VehiclePieceFile[];
  driver: CreateDriverPayload | null;
  driverDocuments: DriverDocumentFile[];
}

export interface PartnerFleetPairSubmitPayload {
  data: {
    brand: string;
    model: string;
    year: number;
    color: string;
    category: VehicleCategory;
    plate?: string;
  };
  pieces: VehiclePieceFile[];
  driver: CreateDriverPayload | null;
  driverDocuments: DriverDocumentFile[];
}

type CatalogItem = { code: string; label: string };

interface FleetPairCreateWizardBaseProps {
  backHref: string;
  phoneCountry?: CatalogCountry | null;
  legacyPhone?: boolean;
  isSubmitting?: boolean;
  extractionWarnings?: string[];
  onExtractionWarnings?: (warnings: string[]) => void;
}

interface AdminWizardProps extends FleetPairCreateWizardBaseProps {
  variant: "admin";
  lockedPartnerId?: string;
  partners: Partner[];
  partnerDetailLoading?: boolean;
  lockedPartner?: PartnerDetail | null;
  categories: CatalogItem[];
  brands: CatalogItem[];
  colors: CatalogItem[];
  catalogLoading?: boolean;
  onSubmit: (payload: AdminFleetPairSubmitPayload) => void;
}

interface PartnerWizardProps extends FleetPairCreateWizardBaseProps {
  variant: "partner";
  onSubmit: (payload: PartnerFleetPairSubmitPayload) => void;
}

export type FleetPairCreateWizardProps = AdminWizardProps | PartnerWizardProps;

function emptyProvenance(): FieldProvenance {
  return {
    first_name: "empty",
    last_name: "empty",
    phone: "empty",
    zone: "empty",
    plate: "empty",
    brand: "empty",
    model: "empty",
    color: "empty",
    year: "empty",
  };
}

export function FleetPairCreateWizard(props: FleetPairCreateWizardProps) {
  const [stepId, setStepId] = useState<WizardStepId>("mode");
  const [creationMode, setCreationMode] = useState<CreationMode | null>(null);
  const [documents, setDocuments] = useState<WizardDocumentsState>(EMPTY_WIZARD_DOCUMENTS);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);
  const [driver, setDriver] = useState<CreateDriverPayload | null>({ ...EMPTY_DRIVER });
  const [provenance, setProvenance] = useState<FieldProvenance>(emptyProvenance);
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingModelLabel, setPendingModelLabel] = useState<string | null>(null);

  const [partnerId, setPartnerId] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [seats, setSeats] = useState(4);
  const [plate, setPlate] = useState("");

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState<VehicleCategory>("taxi");

  const adminLocked = props.variant === "admin" && Boolean(props.lockedPartnerId);
  const { data: brandModels, isLoading: modelsLoading } = useVehicleBrandModelsCatalog(
    props.variant === "admin" ? brandCode : ""
  );
  const adminModels = props.variant === "admin" ? (brandModels ?? []) : [];
  const wizardSteps = getWizardStepsForMode(creationMode);
  const stepIndex = getWizardStepIndex(stepId, creationMode);

  useEffect(() => {
    if (props.variant !== "admin") return;
    if (!categoryCode && props.categories.length) {
      setCategoryCode(props.categories[0]!.code);
    }
  }, [props, categoryCode]);

  useEffect(() => {
    if (props.variant !== "admin") return;
    setModelCode("");
  }, [brandCode, props.variant]);

  useEffect(() => {
    if (props.variant !== "admin" || !pendingModelLabel) return;
    const match = matchCatalogCode(adminModels, pendingModelLabel);
    if (match) {
      setModelCode(match);
      setProvenance((p) => ({ ...p, model: "ai" }));
      setPendingModelLabel(null);
    }
  }, [pendingModelLabel, adminModels, props.variant]);

  useEffect(() => {
    if (props.variant !== "admin" || !adminLocked) return;
    const locked = props.lockedPartner;
    if (!locked) return;
    setPartnerId(String(locked.id));
    if (locked.city && locked.city !== "—") {
      setDriver((d) => ({ ...(d ?? EMPTY_DRIVER), zone: locked.city }));
    }
  }, [adminLocked, props]);

  const markManual = useCallback((field: string) => {
    setProvenance((p) => ({ ...p, [field]: "manual" }));
  }, []);

  const applyExtraction = useCallback(
    (merged: MergedExtraction) => {
      setExtractionWarnings(merged.warnings);
      props.onExtractionWarnings?.(merged.warnings);

      setDriver((prev) => {
        const base = prev ?? { ...EMPTY_DRIVER };
        const first_name =
          !base.first_name.trim() && merged.driver.first_name
            ? merged.driver.first_name
            : base.first_name;
        const last_name =
          !base.last_name.trim() && merged.driver.last_name
            ? merged.driver.last_name
            : base.last_name;
        if (first_name !== base.first_name) {
          setProvenance((p) => ({ ...p, first_name: "ai" }));
        }
        if (last_name !== base.last_name) {
          setProvenance((p) => ({ ...p, last_name: "ai" }));
        }
        return { ...base, first_name, last_name };
      });

      setPlate((p) => {
        if (p.trim() || !merged.vehicle.plate) return p;
        setProvenance((prov) => ({ ...prov, plate: "ai" }));
        return merged.vehicle.plate!;
      });

      setYear((y) => {
        if (!merged.vehicle.year) return y;
        setProvenance((prov) => ({ ...prov, year: "ai" }));
        return merged.vehicle.year;
      });

      if (props.variant === "admin") {
        if (merged.vehicle.brand) {
          const brandMatch = matchCatalogCode(props.brands, merged.vehicle.brand);
          if (brandMatch) {
            setBrandCode((b) => b || brandMatch);
            setProvenance((p) => ({ ...p, brand: "ai" }));
          }
        }
        if (merged.vehicle.color) {
          const colorMatch = matchCatalogCode(props.colors, merged.vehicle.color);
          if (colorMatch) {
            setColorCode((c) => c || colorMatch);
            setProvenance((p) => ({ ...p, color: "ai" }));
          }
        }
        if (merged.vehicle.model) {
          const modelMatch = matchCatalogCode(adminModels, merged.vehicle.model);
          if (modelMatch) {
            setModelCode((m) => m || modelMatch);
            setProvenance((p) => ({ ...p, model: "ai" }));
          } else {
            setPendingModelLabel(merged.vehicle.model);
          }
        }
      } else {
        if (merged.vehicle.brand && !brand.trim()) {
          setBrand(merged.vehicle.brand);
          setProvenance((p) => ({ ...p, brand: "ai" }));
        }
        if (merged.vehicle.model && !model.trim()) {
          setModel(merged.vehicle.model);
          setProvenance((p) => ({ ...p, model: "ai" }));
        }
        if (merged.vehicle.color && !color.trim()) {
          setColor(merged.vehicle.color);
          setProvenance((p) => ({ ...p, color: "ai" }));
        }
      }
    },
    [adminModels, brand, color, model, props]
  );

  const driverUploads = useMemo(
    () =>
      driverUploadsFromWizard({
        cni: documents.cni,
        license: documents.license,
        selfie: documents.selfie,
      }),
    [documents]
  );

  const vehicleUploads = useMemo(
    () =>
      vehicleUploadsFromWizard({
        registration: documents.registration,
        insurance: documents.insurance,
        technicalInspection: documents.technicalInspection,
      }),
    [documents]
  );

  const pieces = useMemo(() => flattenVehiclePieces(vehicleUploads), [vehicleUploads]);
  const driverDocuments = useMemo(
    () => flattenDriverDocuments(driverUploads),
    [driverUploads]
  );

  const driverValid = isDriverComplete(driver);
  const catalogLoading =
    props.variant === "admin"
      ? Boolean(props.catalogLoading) || modelsLoading
      : false;

  const validateAdmin = (): string[] => {
    const next: string[] = [];
    if (!partnerId.trim()) next.push("Sélectionnez un partenaire.");
    if (!categoryCode.trim()) next.push("Sélectionnez une catégorie.");
    if (!brandCode.trim()) next.push("Sélectionnez une marque.");
    if (!modelCode.trim()) next.push("Sélectionnez un modèle.");
    if (!colorCode.trim()) next.push("Sélectionnez une couleur.");
    if (year < 1990 || year > new Date().getFullYear() + 1) next.push("Année invalide.");
    if (seats < 1 || seats > 12) next.push("Nombre de places invalide.");
    if (!driverValid) next.push("Renseignez tous les champs du chauffeur.");
    return next;
  };

  const validatePartner = (): string[] => {
    const next: string[] = [];
    if (!brand.trim()) next.push("Indiquez la marque.");
    if (!model.trim()) next.push("Indiquez le modèle.");
    if (!color.trim()) next.push("Indiquez la couleur.");
    if (!driverValid) next.push("Renseignez tous les champs du chauffeur.");
    return next;
  };

  const handleSubmit = () => {
    const next = props.variant === "admin" ? validateAdmin() : validatePartner();
    setErrors(next);
    if (next.length) return;

    if (props.variant === "admin") {
      props.onSubmit({
        data: {
          partnerId: partnerId.trim(),
          categoryCode: categoryCode.trim(),
          brandCode: brandCode.trim(),
          modelCode: modelCode.trim(),
          colorCode: colorCode.trim(),
          manufactureYear: year,
          seatsCount: seats,
          plateNumber: plate.trim() || undefined,
        },
        pieces,
        driver,
        driverDocuments,
      });
    } else {
      props.onSubmit({
        data: {
          brand: brand.trim(),
          model: model.trim(),
          year,
          color: color.trim(),
          category,
          plate: plate.trim() || undefined,
        },
        pieces,
        driver,
        driverDocuments,
      });
    }
  };

  const goToReview = () => setStepId("review");

  const handleModeSelect = (mode: CreationMode) => {
    setCreationMode(mode);
    setStepId("documents");
  };

  const handleDocumentsNext = () => {
    if (creationMode === "ai") {
      setStepId("extraction");
    } else {
      goToReview();
    }
  };

  const labelClass = (field: string) =>
    `mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2 ${fieldInputClass(provenance[field] ?? "empty")}`;

  return (
    <div className="space-y-6">
      <WizardStepper steps={wizardSteps} currentIndex={stepIndex} />

      {errors.length > 0 && stepId === "review" && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {extractionWarnings.length > 0 && stepId === "review" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Analyse partielle ou incomplète</p>
          <ul className="mt-1 list-inside list-disc text-amber-800">
            {extractionWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {stepId === "mode" && <ModeStep onSelect={handleModeSelect} />}

      {stepId === "documents" && (
        <>
          <DocumentsStep
            value={documents}
            onChange={setDocuments}
            intent={creationMode === "manual" ? "manual" : "ai"}
          />
          <WizardFooter
            backHref={props.backHref}
            onBack={() => setStepId("mode")}
            onSkip={creationMode === "ai" ? goToReview : undefined}
            skipLabel={
              creationMode === "ai" ? "Passer l'analyse · saisie manuelle" : undefined
            }
            onPrimary={handleDocumentsNext}
            primaryLabel={
              creationMode === "ai"
                ? "Lancer l'analyse"
                : "Continuer vers la vérification"
            }
          />
        </>
      )}

      {stepId === "extraction" && (
        <>
          <ExtractionStep
            documents={documents}
            onComplete={(merged) => {
              applyExtraction(merged);
              goToReview();
            }}
            onSkip={goToReview}
            onError={(msg) => {
              setExtractionWarnings([msg]);
              goToReview();
            }}
          />
        </>
      )}

      {stepId === "review" && (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
              <h2 className="text-sm font-semibold text-foreground">
                Informations véhicule
                <FieldSourceBadge source={provenance.plate === "ai" ? "ai" : "empty"} />
              </h2>

              {props.variant === "admin" ? (
                <>
                  <label className="block">
                    <span className="text-sm font-medium">Partenaire</span>
                    <select
                      value={partnerId}
                      onChange={(e) => {
                        setPartnerId(e.target.value);
                        markManual("partner");
                      }}
                      disabled={adminLocked || props.partnerDetailLoading}
                      className={labelClass("partner")}
                      required
                    >
                      <option value="">— Choisir un partenaire —</option>
                      {props.partners.map((p) => (
                        <option key={String(p.id)} value={String(p.id)}>
                          {p.name}
                          {p.city ? ` · ${p.city}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">
                      Catégorie
                    </span>
                    <select
                      value={categoryCode}
                      onChange={(e) => setCategoryCode(e.target.value)}
                      disabled={catalogLoading}
                      className={labelClass("category")}
                      required
                    >
                      <option value="">— Catégorie —</option>
                      {props.categories.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium">
                        Marque
                        <FieldSourceBadge source={provenance.brand ?? "empty"} />
                      </span>
                      <select
                        value={brandCode}
                        onChange={(e) => {
                          setBrandCode(e.target.value);
                          markManual("brand");
                        }}
                        disabled={catalogLoading}
                        className={labelClass("brand")}
                        required
                      >
                        <option value="">— Marque —</option>
                        {props.brands.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium">
                        Modèle
                        <FieldSourceBadge source={provenance.model ?? "empty"} />
                      </span>
                      <select
                        value={modelCode}
                        onChange={(e) => {
                          setModelCode(e.target.value);
                          markManual("model");
                        }}
                        disabled={!brandCode || catalogLoading}
                        className={labelClass("model")}
                        required
                      >
                        <option value="">
                          {!brandCode ? "— Choisir une marque —" : "— Modèle —"}
                        </option>
                        {adminModels.map((m) => (
                          <option key={m.code} value={m.code}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium">
                      Couleur
                      <FieldSourceBadge source={provenance.color ?? "empty"} />
                    </span>
                    <select
                      value={colorCode}
                      onChange={(e) => {
                        setColorCode(e.target.value);
                        markManual("color");
                      }}
                      disabled={catalogLoading}
                      className={labelClass("color")}
                      required
                    >
                      <option value="">— Couleur —</option>
                      {props.colors.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium">
                        Marque
                        <FieldSourceBadge source={provenance.brand ?? "empty"} />
                      </span>
                      <input
                        value={brand}
                        onChange={(e) => {
                          setBrand(e.target.value);
                          markManual("brand");
                        }}
                        className={labelClass("brand")}
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium">
                        Modèle
                        <FieldSourceBadge source={provenance.model ?? "empty"} />
                      </span>
                      <input
                        value={model}
                        onChange={(e) => {
                          setModel(e.target.value);
                          markManual("model");
                        }}
                        className={labelClass("model")}
                        required
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium">Catégorie</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                      className={labelClass("category")}
                    >
                      {PARTNER_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">
                      Couleur
                      <FieldSourceBadge source={provenance.color ?? "empty"} />
                    </span>
                    <input
                      value={color}
                      onChange={(e) => {
                        setColor(e.target.value);
                        markManual("color");
                      }}
                      className={labelClass("color")}
                      required
                    />
                  </label>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">
                    Année
                    <FieldSourceBadge source={provenance.year ?? "empty"} />
                  </span>
                  <input
                    type="number"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    value={year}
                    onChange={(e) => {
                      setYear(Number(e.target.value));
                      markManual("year");
                    }}
                    className={labelClass("year")}
                    required
                  />
                </label>
                {props.variant === "admin" && (
                  <label className="block">
                    <span className="text-sm font-medium">Places</span>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className={labelClass("seats")}
                      required
                    />
                  </label>
                )}
              </div>

              <label className="block">
                <span className="text-sm font-medium">
                  Plaque (optionnel)
                  <FieldSourceBadge source={provenance.plate ?? "empty"} />
                </span>
                <input
                  value={plate}
                  onChange={(e) => {
                    setPlate(e.target.value);
                    markManual("plate");
                  }}
                  placeholder="AB-452-CI"
                  className={labelClass("plate")}
                />
              </label>
            </div>

            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Documents téléversés
              </h2>
              <DocumentSummary documents={documents} />
            </div>
          </div>

          <VehicleCreateDriverSection
            driver={driver}
            onChange={(next) => {
              if (!next) return;
              setDriver(next);
              markManual("first_name");
            }}
            required
            phoneCountry={props.legacyPhone ? null : props.phoneCountry ?? null}
          />

          <WizardFooter
            backHref={props.backHref}
            onBack={() => setStepId("documents")}
            onPrimary={handleSubmit}
            primaryLabel={
              props.isSubmitting ? "Création…" : vehicleCreateSubmitLabel(pieces)
            }
            primaryDisabled={props.isSubmitting || catalogLoading || !driverValid}
            showCancel
          />
        </>
      )}
    </div>
  );
}

function DocumentSummary({ documents }: { documents: WizardDocumentsState }) {
  const lines: string[] = [];
  if (documents.cni.recto || documents.cni.verso) {
    lines.push(
      `CNI : ${[documents.cni.recto && "recto", documents.cni.verso && "verso"].filter(Boolean).join(" + ")}`
    );
  }
  if (documents.license.recto || documents.license.verso) {
    lines.push(
      `Permis : ${[documents.license.recto && "recto", documents.license.verso && "verso"].filter(Boolean).join(" + ")}`
    );
  }
  if (documents.registration.recto || documents.registration.verso) {
    lines.push("Carte grise");
  }
  if (documents.insurance) lines.push("Assurance");
  if (documents.technicalInspection) lines.push("Visite technique");
  if (documents.selfie) lines.push("Selfie");
  if (!lines.length) {
    return (
      <p className="text-sm text-muted">
        Aucun document téléversé — revenez à l&apos;étape précédente pour ajouter les
        pièces.
      </p>
    );
  }
  return (
    <ul className="space-y-1 text-sm text-muted">
      {lines.map((line) => (
        <li key={line} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          {line}
        </li>
      ))}
    </ul>
  );
}

function WizardFooter({
  backHref,
  onBack,
  onSkip,
  skipLabel,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  showCancel,
}: {
  backHref: string;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  showCancel?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
      <div className="flex flex-wrap gap-2">
        {onBack && (
          <Button type="button" variant="secondary" onClick={onBack}>
            ← Retour
          </Button>
        )}
        {showCancel && (
          <Link href={backHref}>
            <Button type="button" variant="ghost">
              Annuler
            </Button>
          </Link>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {onSkip && skipLabel && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            {skipLabel}
          </button>
        )}
        <Button type="button" onClick={onPrimary} disabled={primaryDisabled}>
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
