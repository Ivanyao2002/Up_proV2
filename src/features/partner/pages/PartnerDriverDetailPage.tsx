"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Tabs } from "@/shared/ui/Tabs";
import { KycDocumentCard } from "@/shared/ui/KycDocumentCard";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { KpiCard } from "@/shared/ui/KpiCard";
import { formatFCFA } from "@/shared/lib/format";
import { notificationService } from "@/core/http/notificationService";
import type { KycDocument } from "@/shared/types";
import {
  usePartnerDriverDetail,
  useUploadPartnerDriverDocument,
} from "../api/drivers.queries";

interface PartnerDriverDetailPageProps {
  driverId: string;
}

function canUploadDoc(doc: KycDocument): boolean {
  return doc.status === "rejected" || !doc.uploaded_at;
}

export function PartnerDriverDetailPage({ driverId }: PartnerDriverDetailPageProps) {
  const [tab, setTab] = useState("overview");
  const { data: driver, isLoading, isError } = usePartnerDriverDetail(driverId);
  const uploadDoc = useUploadPartnerDriverDocument(driverId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !driver) {
    return (
      <p className="text-sm text-red-600">
        Chauffeur introuvable.{" "}
        <Link href="/partner/drivers" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const fullName = `${driver.first_name} ${driver.last_name}`;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={fullName}
        breadcrumb={["Partenaire", "Chauffeurs", fullName]}
        actions={
          <div className="flex gap-2">
            <AccountStatusPill status={driver.account_status} />
            <AvailabilityPill status={driver.availability} />
          </div>
        }
      />

      <Tabs
        tabs={[
          { id: "overview", label: "Aperçu" },
          { id: "kyc", label: "Documents" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-6">
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Courses totales" value={String(driver.stats.trips_total)} />
            <KpiCard
              label="Taux d'acceptation"
              value={`${driver.stats.acceptance_rate_pct} %`}
            />
            <KpiCard
              label="Portefeuille chauffeur"
              value={formatFCFA(driver.stats.wallet_balance_fcfa)}
            />
          </div>
        )}

        {tab === "kyc" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {driver.kyc_documents.map((doc) => (
              <KycDocumentCard
                key={doc.id}
                document={doc}
                canUpload={canUploadDoc(doc)}
                uploadHint="PDF ou image · max 5 Mo"
                onUpload={(file) => {
                  uploadDoc.mutate(
                    { type: doc.type, file },
                    {
                      onSuccess: () =>
                        notificationService.success("Document envoyé — validation en cours"),
                      onError: () => notificationService.error("Échec de l'envoi"),
                    }
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
