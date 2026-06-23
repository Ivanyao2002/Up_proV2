"use client";

import { useScope } from "@/core/auth/useScope";
import { PartnerDocumentsPanel } from "@/features/network/components/PartnerDocumentsPanel";

export function PartnerDocumentsSection() {
  const { ownerId } = useScope();

  if (!ownerId) {
    return (
      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <p className="text-sm text-muted">Chargement du profil partenaire…</p>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Documents légaux</h3>
        <p className="text-xs text-muted">
          Pièce d&apos;identité du gérant et registre de commerce — dépôt et suivi de validation.
        </p>
      </div>
      <PartnerDocumentsPanel partnerId={String(ownerId)} canUpload scope="partner" />
    </section>
  );
}
