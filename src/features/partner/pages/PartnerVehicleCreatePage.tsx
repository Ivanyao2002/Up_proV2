"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import {
  VehicleCreatePiecesSection,
  type VehiclePieceFile,
} from "../components/VehicleCreatePiecesSection";
import { VehicleCreateDriverSection } from "../components/VehicleCreateDriverSection";
import {
  VehicleCreateDriverDocumentsSection,
  type DriverDocumentFile,
} from "../components/VehicleCreateDriverDocumentsSection";
import type { CreateDriverPayload } from "../api/drivers.service";
import type { VehicleCategory } from "@/shared/types";
import { useCreateVehicle } from "../api/vehicles.queries";

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "taxi", label: "Taxi" },
  { value: "delivery", label: "Livraison" },
  { value: "van", label: "Utilitaire" },
  { value: "premium", label: "Premium" },
];

function isDriverComplete(driver: CreateDriverPayload | null): boolean {
  if (!driver) return true;
  return (
    driver.first_name.trim().length > 0 &&
    driver.last_name.trim().length > 0 &&
    driver.phone.trim().length > 0 &&
    driver.zone.trim().length > 0
  );
}

function submitLabel(pieces: VehiclePieceFile[], hasDriver: boolean): string {
  const parts: string[] = ["Créer le véhicule"];
  if (hasDriver) parts.push("chauffeur");
  if (pieces.length > 0) parts.push("pièces");
  if (parts.length === 1) return "Créer (brouillon)";
  return parts.join(" + ");
}

export function PartnerVehicleCreatePage() {
  const router = useRouter();
  const create = useCreateVehicle();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [category, setCategory] = useState<VehicleCategory>("taxi");
  const [pieces, setPieces] = useState<VehiclePieceFile[]>([]);
  const [driver, setDriver] = useState<CreateDriverPayload | null>(null);
  const [driverDocuments, setDriverDocuments] = useState<DriverDocumentFile[]>([]);

  const handleDriverChange = (next: CreateDriverPayload | null) => {
    setDriver(next);
    if (!next) setDriverDocuments([]);
  };

  const hasRegistration = pieces.some((p) => p.type === "registration");
  const hasDriver = driver !== null;
  const driverValid = isDriverComplete(driver);

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Ajouter un véhicule"
        breadcrumb={["Partenaire", "Véhicules", "Nouveau"]}
      />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!driverValid) {
            notificationService.warning("Renseignez tous les champs du chauffeur ou décochez la section");
            return;
          }
          create.mutate(
            {
              data: { brand, model, year, color, category, plate: plate || undefined },
              pieces,
              driver,
              driverDocuments: hasDriver ? driverDocuments : [],
            },
            {
              onSuccess: (vehicle) => {
                if (hasDriver) {
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
                router.push(`/partner/fleet/${vehicle.id}`);
              },
              onError: () => {
                notificationService.error("Impossible de créer le véhicule");
              },
            }
          );
        }}
      >
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[#212529]">Informations véhicule</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Marque</span>
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  placeholder="Toyota"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Modèle</span>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  placeholder="Corolla"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Catégorie</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
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
                <span className="text-sm font-medium">Couleur</span>
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
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
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                placeholder="AB-452-CI"
              />
            </label>
          </div>

          <VehicleCreatePiecesSection pieces={pieces} onChange={setPieces} />
        </div>

        <div
          className={
            hasDriver ? "grid items-start gap-6 lg:grid-cols-2" : "w-full"
          }
        >
          <VehicleCreateDriverSection driver={driver} onChange={handleDriverChange} />
          {hasDriver && (
            <VehicleCreateDriverDocumentsSection
              documents={driverDocuments}
              onChange={setDriverDocuments}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-6">
          <Button type="submit" disabled={create.isPending || (hasDriver && !driverValid)}>
            {create.isPending ? "Création…" : submitLabel(pieces, hasDriver)}
          </Button>
          <Link href="/partner/fleet">
            <Button type="button" variant="secondary">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
