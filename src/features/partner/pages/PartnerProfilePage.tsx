"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { formatDateTime } from "@/shared/lib/format";
import { usePartnerProfile, useUpdatePartnerProfile } from "../api/profile.queries";

export function PartnerProfilePage() {
  const { data, isLoading, isError } = usePartnerProfile();
  const update = useUpdatePartnerProfile();

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (data) {
      setContactEmail(data.contact_email);
      setContactPhone(data.contact_phone);
      setNotificationEmail(data.notification_email);
      setAddress(data.address);
    }
  }, [data]);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger le profil.</p>;
  }

  return (
    <div className="animate-fade-up mx-auto max-w-4xl items-center justify-center">
      <PageHeader
        title="Mon profil"
        breadcrumb={["Partenaire", "Compte"]}
        actions={<EntityStatusPill status={data.status} />}
      />

      <div className="space-y-6">
        <section className="rounded-card border border-border bg-surface p-6 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">Entreprise</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Raison sociale</dt>
              <dd className="text-right font-medium">{data.legal_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Nom commercial</dt>
              <dd className="text-right font-medium">{data.company_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">RCCM</dt>
              <dd className="text-right">{data.rccm}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Franchise</dt>
              <dd className="text-right">{data.franchise_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Membre depuis</dt>
              <dd className="text-right">{formatDateTime(data.created_at)}</dd>
            </div>
          </dl>
        </section>

        <form
          className="rounded-card border border-border bg-surface p-6 shadow-card space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate({
              contact_email: contactEmail,
              contact_phone: contactPhone,
              notification_email: notificationEmail,
              address,
            });
          }}
        >
          <h2 className="text-sm font-semibold text-foreground">Coordonnées</h2>
          <p className="text-xs text-muted">
            Ces informations sont visibles par votre franchise et le support UpJunoo.
          </p>

          <label className="block">
            <span className="text-sm font-medium">Email de contact</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Téléphone</span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Email notifications</span>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
            <span className="mt-1 block text-xs text-muted">
              KYC chauffeurs, validation véhicules, retraits
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Adresse</span>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
            />
          </label>

          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </form>
      </div>
    </div>
  );
}
