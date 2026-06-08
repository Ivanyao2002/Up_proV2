"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import { usePartnersList } from "@/features/network/api/partners.queries";
import {
  VehicleCreatePiecesSection,
  type VehiclePieceFile,
} from "@/features/partner/components/VehicleCreatePiecesSection";
import { VehicleCreateDriverSection } from "@/features/partner/components/VehicleCreateDriverSection";
import {
  VehicleCreateDriverDocumentsSection,
  type DriverDocumentFile,
} from "@/features/partner/components/VehicleCreateDriverDocumentsSection";
import type { CreateDriverPayload } from "@/features/partner/api/drivers.service";
import {
  isDriverComplete,
  vehicleCreateSubmitLabel,
} from "../lib/vehicleCreateForm";
import {
  useCreateAdminVehicle,
  useVehicleBrandModelsCatalog,
  useVehicleBrandsCatalog,
  useVehicleCategoriesCatalog,
  useVehicleColorsCatalog,
} from "../api/vehicles.queries";

export function VehicleCreatePage() {
  const router = useRouter();
  const create = useCreateAdminVehicle();

  const { data: partners } = usePartnersList({ per_page: 100 });
  const { data: categories, isLoading: categoriesLoading } = useVehicleCategoriesCatalog();
  const { data: brands, isLoading: brandsLoading } = useVehicleBrandsCatalog();
  const { data: colors, isLoading: colorsLoading } = useVehicleColorsCatalog();

  const [partnerId, setPartnerId] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [brandCode, setBrandCode] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [colorCode, setColorCode] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [seats, setSeats] = useState(4);
  const [plate, setPlate] = useState("");
  const [pieces, setPieces] = useState<VehiclePieceFile[]>([]);
  const [driver, setDriver] = useState<CreateDriverPayload | null>(null);
  const [driverDocuments, setDriverDocuments] = useState<DriverDocumentFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const { data: models, isLoading: modelsLoading } = useVehicleBrandModelsCatalog(brandCode);

  useEffect(() => {
    if (!categoryCode && categories?.length) {
      setCategoryCode(categories[0].code);
    }
  }, [categories, categoryCode]);

  useEffect(() => {
    setModelCode("");
  }, [brandCode]);

  const handleDriverChange = (next: CreateDriverPayload | null) => {
    setDriver(next);
    if (!next) setDriverDocuments([]);
  };

  const hasRegistration = pieces.some((p) => p.type === "registration");
  const hasDriver = driver !== null;
  const driverValid = isDriverComplete(driver);
  const catalogLoading = categoriesLoading || brandsLoading || colorsLoading;

  const submit = () => {
    const next: string[] = [];
    if (!partnerId.trim()) next.push("Sélectionnez un partenaire.");
    if (!categoryCode.trim()) next.push("Sélectionnez une catégorie.");
    if (!brandCode.trim()) next.push("Sélectionnez une marque.");
    if (!modelCode.trim()) next.push("Sélectionnez un modèle.");
    if (!colorCode.trim()) next.push("Sélectionnez une couleur.");
    if (year < 1990 || year > new Date().getFullYear() + 1) {
      next.push("Année invalide.");
    }
    if (seats < 1 || seats > 12) next.push("Nombre de places invalide.");
    if (hasDriver && !driverValid) {
      next.push("Renseignez tous les champs du chauffeur ou décochez la section.");
    }
    setErrors(next);
    if (next.length) return;

    create.mutate(
      {
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
        driverDocuments: hasDriver ? driverDocuments : [],
      },
      {
        onSuccess: (vehicle) => {
          if (hasDriver && vehicle.driver_name) {
            notificationService.success(
              `Véhicule créé — chauffeur assigné (${vehicle.driver_name})`
            );
          } else if (pieces.length === 0) {
            notificationService.info(
              "Véhicule créé en brouillon — pièces et chauffeur à ajouter sur la fiche"
            );
          } else if (hasRegistration) {
            notificationService.success(
              "Véhicule créé — pièces envoyées, validation en cours"
            );
          } else {
            notificationService.success(
              "Véhicule créé — pensez à ajouter la carte grise pour la validation"
            );
          }
          router.push("/admin/fleet/vehicles");
        },
      }
    );
  };

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Nouveau véhicule"
        breadcrumb={["Admin", "Flotte", "Véhicules", "Nouveau"]}
      />

      <p className="mb-6 text-sm">
        <Link href="/admin/fleet/vehicles" className="text-teal hover:underline">
          ← Retour à la liste
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
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Informations véhicule</h2>

            <label className="block">
              <span className="text-sm font-medium">Partenaire</span>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                required
              >
                <option value="">— Choisir un partenaire —</option>
                {(partners?.data ?? []).map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.name}
                    {p.city ? ` · ${p.city}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Catégorie</span>
              <select
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                disabled={catalogLoading}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                required
              >
                <option value="">— Catégorie —</option>
                {(categories ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Marque</span>
                <select
                  value={brandCode}
                  onChange={(e) => setBrandCode(e.target.value)}
                  disabled={catalogLoading}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">— Marque —</option>
                  {(brands ?? []).map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Modèle</span>
                <select
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  disabled={!brandCode || modelsLoading}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">
                    {!brandCode ? "— Choisir une marque d'abord —" : "— Modèle —"}
                  </option>
                  {(models ?? []).map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Couleur</span>
              <select
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                disabled={catalogLoading}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
                required
              >
                <option value="">— Couleur —</option>
                {(colors ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Année</span>
                <input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Places</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Plaque (optionnel)</span>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="AB-452-CI"
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              />
            </label>
          </div>

          <VehicleCreatePiecesSection pieces={pieces} onChange={setPieces} />
        </div>

        <div className={hasDriver ? "grid items-start gap-6 lg:grid-cols-2" : "w-full"}>
          <VehicleCreateDriverSection driver={driver} onChange={handleDriverChange} />
          {hasDriver && (
            <VehicleCreateDriverDocumentsSection
              documents={driverDocuments}
              onChange={setDriverDocuments}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-6">
          <Button
            type="submit"
            disabled={create.isPending || catalogLoading || (hasDriver && !driverValid)}
          >
            {create.isPending ? "Création…" : vehicleCreateSubmitLabel(pieces, hasDriver)}
          </Button>
          <Link href="/admin/fleet/vehicles">
            <Button type="button" variant="secondary">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
