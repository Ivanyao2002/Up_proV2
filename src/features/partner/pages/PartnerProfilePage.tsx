"use client";

import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { formatDateTime, formatDate } from "@/shared/lib/format";
import { useScope } from "@/core/auth/useScope";
import { usePartnerProfile, useUpdatePartnerProfile } from "../api/profile.queries";
import { PartnerDocumentsSection } from "../components/PartnerDocumentsSection";

export function PartnerProfilePage() {
  const { data, isLoading, isError } = usePartnerProfile();
  const update = useUpdatePartnerProfile();
  const { hasModule } = useScope();
  const isFleet = hasModule("fleet");
  const isRental = hasModule("rental");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (data) {
      setContactEmail(data.contact_email);
      setContactPhone(data.contact_phone);
      setNotificationEmail(data.notification_email);
      setAddress(data.address);
      setCity(data.city);
    }
  }, [data]);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Impossible de charger le profil.</p>;
  }

  return (
    <div className="animate-fade-up mx-auto max-w-5xl">
      <PageHeader
        title="Mon profil"
        breadcrumb={["Partenaire", "Compte"]}
        actions={<EntityStatusPill status={data.status} />}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête visuel */}
          <section className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="flex items-start gap-4">
              {data.avatar_url ? (
                <img
                  src={data.avatar_url}
                  alt={data.company_name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-2xl font-bold text-teal">
                  {data.company_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">{data.company_name}</h2>
                <p className="text-sm text-muted">{data.legal_name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.account_type && (
                    <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-1 text-xs text-muted">
                      {data.account_type === "INDIVIDUAL" ? "Particulier" : data.account_type}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-1 text-xs text-muted">
                    RCCM: {data.rccm || "—"}
                  </span>
                  {data.locale && (
                    <span className="inline-flex items-center rounded-full bg-teal/10 px-2 py-1 text-xs text-teal">
                      {data.locale}
                    </span>
                  )}
                  {data.franchise_name && (
                    <span className="inline-flex items-center rounded-full bg-teal/10 px-2 py-1 text-xs text-teal">
                      {data.franchise_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Formulaire Coordonnées */}
          <section className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Coordonnées</h3>
                <p className="text-xs text-muted">
                  Informations visibles par votre franchise et le support
                </p>
              </div>
              <Button
                variant={isEditing ? "secondary" : "primary"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Annuler" : "Modifier"}
              </Button>
            </div>

            {isEditing ? (
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  update.mutate(
                    {
                      contact_email: contactEmail,
                      contact_phone: contactPhone,
                      notification_email: notificationEmail,
                      address,
                      city,
                    },
                    {
                      onSuccess: () => setIsEditing(false),
                    }
                  );
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Email de contact *</span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Téléphone *</span>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium">Email notifications</span>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                  />
                  <span className="mt-1 block text-xs text-muted">
                    {isFleet
                      ? "KYC chauffeurs, validation véhicules, retraits"
                      : "Validation des documents, réservations, retraits"}
                  </span>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium">Adresse</span>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium">Ville</span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={update.isPending}>
                    {update.isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-canvas p-3">
                  <dt className="text-xs text-muted">Email de contact</dt>
                  <dd className="font-medium">{data.contact_email || "—"}</dd>
                </div>
                <div className="rounded-lg bg-canvas p-3">
                  <dt className="text-xs text-muted">Téléphone</dt>
                  <dd className="font-medium">{data.contact_phone || "—"}</dd>
                </div>
                <div className="rounded-lg bg-canvas p-3">
                  <dt className="text-xs text-muted">Email notifications</dt>
                  <dd className="font-medium">{data.notification_email || "—"}</dd>
                </div>
                <div className="rounded-lg bg-canvas p-3">
                  <dt className="text-xs text-muted">Ville</dt>
                  <dd className="font-medium">{data.city || "—"}</dd>
                </div>
                <div className="sm:col-span-2 rounded-lg bg-canvas p-3">
                  <dt className="text-xs text-muted">Adresse</dt>
                  <dd className="font-medium">{data.address || "—"}</dd>
                </div>
              </dl>
            )}
          </section>

          {/* Documents KYC */}
          <PartnerDocumentsSection />
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* Infos compte */}
          <section className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Compte</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Membre depuis</dt>
                <dd>{formatDate(data.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Statut</dt>
                <dd>
                  <EntityStatusPill status={data.status} />
                </dd>
              </div>
            </dl>
          </section>

          {/* Actions rapides */}
          <section className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Actions rapides</h3>
            <div className="mt-4 space-y-2">
              <Link
                href="/partner/wallet"
                className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-canvas transition-colors"
              >
                <span className="text-lg">💳</span>
                <span className="flex-1">Voir mon portefeuille</span>
              </Link>
              {isFleet && (
                <>
                  <Link
                    href="/partner/drivers"
                    className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-canvas transition-colors"
                  >
                    <span className="text-lg">👥</span>
                    <span className="flex-1">Gérer mes chauffeurs</span>
                  </Link>
                  <Link
                    href="/partner/fleet"
                    className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-canvas transition-colors"
                  >
                    <span className="text-lg">🚗</span>
                    <span className="flex-1">Gérer ma flotte</span>
                  </Link>
                </>
              )}
              {isRental && (
                <Link
                  href="/partner/rental/fleet"
                  className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-canvas transition-colors"
                >
                  <span className="text-lg">🚗</span>
                  <span className="flex-1">Gérer ma flotte location</span>
                </Link>
              )}
              <Link
                href="/partner/support/chat"
                className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-canvas transition-colors"
              >
                <span className="text-lg">💬</span>
                <span className="flex-1">Contacter le support</span>
              </Link>
            </div>
          </section>

          {/* Paramètres */}
          <section className="rounded-card border border-border bg-surface p-6 shadow-card">
            <h3 className="text-sm font-semibold text-foreground">Paramètres</h3>
            <div className="mt-4 space-y-3 opacity-60">
              <label className="flex items-center justify-between">
                <span className="text-sm">Notifications email</span>
                <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="h-4 w-4 rounded border-border cursor-not-allowed"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Notifications SMS</span>
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 rounded border-border cursor-not-allowed"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Rapports hebdomadaires</span>
                <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="h-4 w-4 rounded border-border cursor-not-allowed"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-muted">
              Gestion des préférences de notification à venir (API non disponible).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

