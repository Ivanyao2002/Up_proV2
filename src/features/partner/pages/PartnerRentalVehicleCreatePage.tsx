"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import {
  useVehicleBrandsCatalog,
  useVehicleBrandModelsCatalog,
} from "@/features/fleet/api/vehicles.queries";
import { useCreateRentalVehicle } from "../api/rentalFleet.queries";
import {
  RENTAL_VEHICLE_CATEGORY_LABELS,
  RENTAL_VEHICLE_OPTION_LABELS,
  RENTAL_VEHICLE_DOC_LABELS,
  type CreateRentalVehiclePayload,
  type RentalVehicleCategory,
  type RentalVehicleOption,
  type RentalVehicleTransmission,
  type RentalVehicleDocType,
} from "../api/rentalFleet.service";

const CATEGORIES = Object.keys(RENTAL_VEHICLE_CATEGORY_LABELS) as RentalVehicleCategory[];
const OPTIONS = Object.keys(RENTAL_VEHICLE_OPTION_LABELS) as RentalVehicleOption[];
const DOC_TYPES = Object.keys(RENTAL_VEHICLE_DOC_LABELS) as RentalVehicleDocType[];

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm";

export function PartnerRentalVehicleCreatePage() {
  const router = useRouter();
  const create = useCreateRentalVehicle();

  const [form, setForm] = useState<CreateRentalVehiclePayload>({
    brand: "",
    model: "",
    category: "voiture",
    plate: "",
    year: undefined,
    seats: undefined,
    transmission: "manuelle",
    options: [],
    documents: [],
  });
  const [docExpiries, setDocExpiries] = useState<Partial<Record<RentalVehicleDocType, string>>>(
    {}
  );

  // Marque / modèle depuis le catalogue API (comme la flotte VTC).
  const [brandCode, setBrandCode] = useState("");
  const { data: brands, isLoading: brandsLoading } = useVehicleBrandsCatalog();
  const { data: models, isLoading: modelsLoading } =
    useVehicleBrandModelsCatalog(brandCode);

  const onBrandChange = (code: string) => {
    setBrandCode(code);
    const label = (brands ?? []).find((b) => b.code === code)?.label ?? "";
    // Changer de marque réinitialise le modèle.
    setForm((f) => ({ ...f, brand: label, model: "" }));
  };

  const onModelChange = (code: string) => {
    const label = (models ?? []).find((m) => m.code === code)?.label ?? "";
    setForm((f) => ({ ...f, model: label }));
  };

  const toggleOption = (opt: RentalVehicleOption) => {
    setForm((f) => {
      const set = new Set(f.options ?? []);
      if (set.has(opt)) set.delete(opt);
      else set.add(opt);
      return { ...f, options: Array.from(set) };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const documents = DOC_TYPES.filter((t) => docExpiries[t]).map((t) => ({
      type: t,
      expires_at: docExpiries[t],
    }));
    create.mutate(
      { ...form, documents },
      {
        onSuccess: (v) => {
          notificationService.success("Véhicule ajouté à la flotte");
          router.push(v?.id ? `/partner/rental/fleet/${v.id}` : "/partner/rental/fleet");
        },
        onError: () => notificationService.error("Création impossible."),
      }
    );
  };

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Nouveau véhicule de location"
        breadcrumb={["Partenaire", "Location", "Flotte", "Nouveau"]}
      />

      <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-6">
        <Section title="Identification">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie *">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as RentalVehicleCategory })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {RENTAL_VEHICLE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Immatriculation">
              <input
                className={inputClass}
                placeholder="AA-123-BB"
                value={form.plate ?? ""}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
              />
            </Field>
            <Field label="Marque *">
              <select
                required
                className={inputClass}
                value={brandCode}
                onChange={(e) => onBrandChange(e.target.value)}
                disabled={brandsLoading}
              >
                <option value="">
                  {brandsLoading ? "Chargement…" : "Sélectionner une marque"}
                </option>
                {(brands ?? []).map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Modèle *">
              <select
                required
                className={inputClass}
                value={(models ?? []).find((m) => m.label === form.model)?.code ?? ""}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={!brandCode || modelsLoading}
              >
                <option value="">
                  {!brandCode
                    ? "Choisir une marque d'abord"
                    : modelsLoading
                      ? "Chargement…"
                      : "Sélectionner un modèle"}
                </option>
                {(models ?? []).map((m) => (
                  <option key={m.id} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Année">
              <input
                type="number"
                min="1980"
                max="2100"
                className={inputClass}
                value={form.year ?? ""}
                onChange={(e) =>
                  setForm({ ...form, year: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Places / capacité">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={form.seats ?? ""}
                onChange={(e) =>
                  setForm({ ...form, seats: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </Field>
            <Field label="Transmission">
              <select
                className={inputClass}
                value={form.transmission}
                onChange={(e) =>
                  setForm({
                    ...form,
                    transmission: e.target.value as RentalVehicleTransmission,
                  })
                }
              >
                <option value="manuelle">Manuelle</option>
                <option value="automatique">Automatique</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Options activables">
          <div className="flex flex-wrap gap-3">
            {OPTIONS.map((opt) => {
              const checked = (form.options ?? []).includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    checked ? "border-teal bg-teal/5 text-teal" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOption(opt)}
                  />
                  {RENTAL_VEHICLE_OPTION_LABELS[opt]}
                </label>
              );
            })}
          </div>
        </Section>

        <Section title="Documents & échéances">
          <p className="mb-3 text-xs text-muted">
            Renseignez les dates d&apos;expiration pour activer les alertes de renouvellement.
            L&apos;upload des fichiers sera disponible sur la fiche du véhicule.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {DOC_TYPES.map((t) => (
              <Field key={t} label={RENTAL_VEHICLE_DOC_LABELS[t]}>
                <input
                  type="date"
                  className={inputClass}
                  value={docExpiries[t] ?? ""}
                  onChange={(e) =>
                    setDocExpiries((d) => ({ ...d, [t]: e.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/partner/rental/fleet")}
            disabled={create.isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Création..." : "Ajouter le véhicule"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-sm font-semibold text-heading">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
