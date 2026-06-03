"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { notificationService } from "@/core/http/notificationService";
import { VehicleCreateDriverDocumentsSection } from "../components/VehicleCreateDriverDocumentsSection";
import type { CreateDriverPayload } from "../api/drivers.service";
import type { DriverDocumentFile } from "@/shared/types/driverDocuments";
import { useCreatePartnerDriver } from "../api/drivers.queries";

const EMPTY_DRIVER: CreateDriverPayload = {
  first_name: "",
  last_name: "",
  phone: "",
  zone: "",
  email: "",
};

function isDriverComplete(driver: CreateDriverPayload): boolean {
  return (
    driver.first_name.trim().length > 0 &&
    driver.last_name.trim().length > 0 &&
    driver.phone.trim().length > 0 &&
    driver.zone.trim().length > 0
  );
}

export function PartnerDriverCreatePage() {
  const router = useRouter();
  const create = useCreatePartnerDriver();
  const [driver, setDriver] = useState<CreateDriverPayload>({ ...EMPTY_DRIVER });
  const [documents, setDocuments] = useState<DriverDocumentFile[]>([]);
  const valid = isDriverComplete(driver);

  const update = (patch: Partial<CreateDriverPayload>) => {
    setDriver((d) => ({ ...d, ...patch }));
  };

  return (
    <div className="animate-fade-up mx-auto max-w-6xl">
      <PageHeader
        title="Ajouter un chauffeur"
        breadcrumb={["Partenaire", "Chauffeurs", "Nouveau"]}
      />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) {
            notificationService.warning("Renseignez les champs obligatoires");
            return;
          }
          create.mutate(
            { data: driver, documents },
            {
              onSuccess: (created) => {
                notificationService.success(
                  documents.length > 0
                    ? "Chauffeur créé — documents envoyés"
                    : "Chauffeur créé — complétez le KYC sur la fiche"
                );
                router.push(`/partner/drivers/${created.id}`);
              },
              onError: () => notificationService.error("Impossible de créer le chauffeur"),
            }
          );
        }}
      >
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-card border border-border bg-surface p-6 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Informations chauffeur</h2>
            <p className="text-sm text-muted">
              Le compte sera créé en attente de validation KYC avant de pouvoir prendre des
              courses.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Prénom</span>
                <input
                  value={driver.first_name}
                  onChange={(e) => update({ first_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Nom</span>
                <input
                  value={driver.last_name}
                  onChange={(e) => update({ last_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Téléphone</span>
              <input
                type="tel"
                value={driver.phone}
                onChange={(e) => update({ phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Zone</span>
                <input
                  value={driver.zone}
                  onChange={(e) => update({ zone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">E-mail (optionnel)</span>
                <input
                  type="email"
                  value={driver.email ?? ""}
                  onChange={(e) => update({ email: e.target.value || undefined })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                />
              </label>
            </div>
          </section>

          <VehicleCreateDriverDocumentsSection
            documents={documents}
            onChange={setDocuments}
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-6">
          <Button type="submit" disabled={create.isPending || !valid}>
            {create.isPending ? "Création…" : "Créer le chauffeur"}
          </Button>
          <Link href="/partner/drivers">
            <Button type="button" variant="secondary">
              Annuler
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
