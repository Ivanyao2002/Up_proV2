"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { KpiCard } from "@/shared/ui/KpiCard";
import { Button } from "@/shared/ui/Button";
import { Tabs } from "@/shared/ui/Tabs";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { StatusPill } from "@/shared/ui/StatusPill";
import { AccountStatusPill, AvailabilityPill } from "@/shared/ui/DriverPills";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel, getServiceLabel } from "@/shared/lib/tripLabels";
import { getDriverAccountStatusLabel, getDriverAvailabilityLabel } from "@/shared/lib/driverLabels";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";
import type { Driver, Trip } from "@/shared/types";
import type { CreatePartnerPayload, FranchisePartnerDetail, PartnerCommission } from "../api/partners.service";
import {
  useFranchisePartnerDetail,
  useFranchisePartnerDrivers,
  useFranchisePartnerOrders,
  useFranchisePartnerCommissions,
  useUpdateFranchisePartner,
  useDeleteFranchisePartner,
} from "../api/partners.queries";

const TABS = [
  { id: "overview", label: "Aperçu" },
  { id: "drivers", label: "Chauffeurs" },
  { id: "trips", label: "Courses" },
  { id: "commissions", label: "Commissions" },
];

interface FranchisePartnerDetailPageProps {
  partnerId: string;
}

function InviteDriverModal({
  partnerId,
  onClose,
}: {
  partnerId: string;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: POST /v1/franchises/{id}/partners/{partnerId}/drivers/invite (MANQUE-011)
    void partnerId;
    setTimeout(() => {
      setSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-card border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Inviter un chauffeur</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
          <p className="text-sm text-muted">
            Le chauffeur recevra un lien d&apos;invitation par SMS pour rejoindre ce partenaire.
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Numéro de téléphone *</label>
            <input
              required
              type="tel"
              placeholder="+225 07 00 00 00 00"
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Route d&apos;invitation en attente de déploiement backend (MANQUE-011).
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Envoi…" : "Envoyer l'invitation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

function TabDrivers({ partnerId }: { partnerId: string }) {
  const [showInvite, setShowInvite] = useState(false);
  const table = useServerTableState();
  const { data, isLoading } = useFranchisePartnerDrivers(partnerId, table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Driver>[] = [
    {
      id: "name",
      header: "Chauffeur",
      cell: (d) => (
        <div>
          <Link href={`/franchise/drivers/${d.id}`} className="font-medium text-foreground hover:text-teal">
            {d.first_name} {d.last_name}
          </Link>
          <p className="text-xs text-muted">{d.phone}</p>
        </div>
      ),
      exportValue: (d) => `${d.first_name} ${d.last_name}`,
    },
    {
      id: "zone",
      header: "Zone",
      cell: (d) => d.zone ?? "—",
      exportValue: (d) => d.zone ?? "",
    },
    {
      id: "account",
      header: "Compte",
      cell: (d) => <AccountStatusPill status={d.account_status} />,
      exportValue: (d) => getDriverAccountStatusLabel(d.account_status),
    },
    {
      id: "availability",
      header: "Dispo.",
      cell: (d) => <AvailabilityPill status={d.availability} />,
      exportValue: (d) => getDriverAvailabilityLabel(d.availability),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => setShowInvite(true)}>
          + Ajouter un chauffeur
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName="chauffeurs-partenaire"
        emptyTitle="Aucun chauffeur"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
      {showInvite && (
        <InviteDriverModal partnerId={partnerId} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

function TabTrips({ partnerId }: { partnerId: string }) {
  const table = useServerTableState();
  const { data, isLoading } = useFranchisePartnerOrders(partnerId, table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const columns: Column<Trip>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <Link href={`/franchise/trips/${t.id}`} className="font-medium text-foreground hover:text-teal">
          {t.ref}
        </Link>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "service",
      header: "Service",
      cell: (t) => getServiceLabel(t.service),
      exportValue: (t) => getServiceLabel(t.service),
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => <StatusPill status={t.status} />,
      exportValue: (t) => getTripStatusLabel(t.status),
    },
    {
      id: "amount",
      header: "Montant",
      cell: (t) => formatFCFA(t.amount_fcfa ?? 0),
      exportValue: (t) => t.amount_fcfa ?? 0,
    },
    {
      id: "date",
      header: "Date",
      cell: (t) => <span className="text-muted">{formatDateTime(t.created_at)}</span>,
      exportValue: (t) => formatDateTime(t.created_at),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      rowKey={(t) => t.id}
      isLoading={isLoading}
      exportFileName="courses-partenaire"
      emptyTitle="Aucune course"
      pagination={false}
      serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
    />
  );
}

function TabCommissions({ partnerId }: { partnerId: string }) {
  const table = useServerTableState();
  const { data, isLoading } = useFranchisePartnerCommissions(partnerId, table.listParams);
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const stats = data?.stats;

  const columns: Column<PartnerCommission>[] = [
    {
      id: "trip",
      header: "Course",
      cell: (c) => (
        <Link href={`/franchise/trips/${c.trip_id}`} className="font-medium text-foreground hover:text-teal">
          {c.trip_ref}
        </Link>
      ),
      exportValue: (c) => c.trip_ref,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (c) => c.driver_name ?? "—",
      exportValue: (c) => c.driver_name ?? "",
    },
    {
      id: "rate",
      header: "Taux",
      cell: (c) => `${c.rate_pct} %`,
      exportValue: (c) => c.rate_pct,
    },
    {
      id: "amount",
      header: "Commission",
      cell: (c) => formatFCFA(c.amount_fcfa),
      exportValue: (c) => c.amount_fcfa,
    },
    {
      id: "date",
      header: "Date",
      cell: (c) => <span className="text-muted">{formatDateTime(c.created_at)}</span>,
      exportValue: (c) => formatDateTime(c.created_at),
    },
    {
      id: "status",
      header: "Statut",
      cell: (c) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          c.status === "paid" ? "bg-emerald-50 text-emerald-700" :
          c.status === "pending" ? "bg-amber-50 text-amber-700" :
          "bg-red-50 text-red-600"
        }`}>
          {c.status === "paid" ? "Versée" : c.status === "pending" ? "En attente" : "Annulée"}
        </span>
      ),
      exportValue: (c) => c.status,
    },
  ];

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Total commissions" value={formatFCFA(stats.total_fcfa)} variant="navy" />
          <KpiCard label="Taux moyen" value={`${stats.avg_rate_pct} %`} variant="teal" />
          <KpiCard label="Nombre de courses" value={String(stats.count)} variant="navy" />
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFileName="commissions-partenaire"
        emptyTitle="Aucune commission"
        pagination={false}
        serverPagination={serverPaginationFromMeta(meta, table.setPage, table.setPageSize)}
      />
    </div>
  );
}

function EditPartnerModal({
  data,
  onClose,
}: {
  data: FranchisePartnerDetail;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<CreatePartnerPayload>>({
    name: data.name,
    legal_name: data.legal_name,
    contact_email: data.contact_email ?? "",
    contact_phone: data.contact_phone ?? "",
    city: data.city,
    address: data.address,
  });
  const update = useUpdateFranchisePartner(String(data.id));

  const f = (key: keyof CreatePartnerPayload) => ({
    value: (form[key] ?? "") as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-card border border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">Modifier le partenaire</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate(form, { onSuccess: onClose });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Nom commercial *</label>
              <input required className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40" {...f("name")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Raison sociale</label>
              <input className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40" {...f("legal_name")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Email *</label>
              <input required type="email" className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40" {...f("contact_email")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Téléphone *</label>
              <input required type="tel" className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40" {...f("contact_phone")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Ville *</label>
              <input required className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40" {...f("city")} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Adresse</label>
              <input className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40" {...f("address")} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}

export function FranchisePartnerDetailPage({ partnerId }: FranchisePartnerDetailPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deletePartner = useDeleteFranchisePartner();
  const { data, isLoading, isError } = useFranchisePartnerDetail(partnerId);

  if (isLoading) {
    return (
      <DetailPageSkeleton
        title="Partenaire"
        breadcrumb={["Franchise", "Partenaires"]}
      />
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Partenaire introuvable.{" "}
        <Link href="/franchise/partners" className="text-teal underline">
          Retour à la liste
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={data.name}
          breadcrumb={["Franchise", "Partenaires", data.name]}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {(data.status === "pending" || data.status === "suspended") && (
                <Button type="button" onClick={() => setConfirmActivate(true)}>
                  {data.status === "suspended" ? "Réactiver" : "Approuver"}
                </Button>
              )}
              {data.status === "active" && (
                <Button type="button" variant="secondary" onClick={() => setConfirmSuspend(true)}>
                  Suspendre
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={() => setShowEdit(true)}>
                Modifier
              </Button>
              <Button type="button" variant="secondary" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
                Supprimer
              </Button>
              <EntityStatusPill status={data.status} />
            </div>
          }
        />
        <p className="mt-0.5 text-sm text-muted">
          {data.city}{data.contact_email ? ` · ${data.contact_email}` : ""}{data.contact_phone ? ` · ${data.contact_phone}` : ""}
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-6">
        {/* ── Aperçu ── */}
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              {/* KPI stats */}
              <div className="grid gap-4 sm:grid-cols-2">
                <KpiCard label="CA total" value={formatFCFA(data.revenue_month_fcfa ?? 0)} variant="navy" />
                <KpiCard label="Solde wallet" value={formatFCFA(data.wallet_balance_fcfa ?? 0)} variant="teal" />
                <KpiCard label="Courses" value={String(data.trips_count ?? 0)} variant="navy" />
                <KpiCard label="Chauffeurs" value={String(data.drivers_count ?? 0)} variant="teal" />
                <KpiCard label="Véhicules" value={String(data.vehicles_count ?? 0)} variant="navy" />
                <KpiCard label="Membre depuis" value={formatDateTime(data.created_at)} variant="teal" />
              </div>
            </div>

            <aside className="space-y-4">
              {/* Coordonnées */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                <h3 className="text-sm font-semibold text-foreground">Coordonnées</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Raison sociale</dt>
                    <dd className="text-foreground">{data.legal_name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Email</dt>
                    <dd className="text-foreground">{data.contact_email ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Téléphone</dt>
                    <dd className="text-foreground">{data.contact_phone ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Adresse</dt>
                    <dd className="text-right text-foreground">{data.address ?? "—"}</dd>
                  </div>
                </dl>
              </div>

              {/* Infos commerciales */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                <h3 className="text-sm font-semibold text-foreground">Infos commerciales</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Type</dt>
                    <dd className="text-foreground">{data.partner_type ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Taux de commission</dt>
                    <dd className="text-foreground">
                      {data.commission_rate != null ? `${data.commission_rate} %` : "—"}
                    </dd>
                  </div>
                  {data.registration_number && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">N° registre</dt>
                      <dd className="text-foreground">{data.registration_number}</dd>
                    </div>
                  )}
                  {data.tax_id && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted">Tax ID</dt>
                      <dd className="text-foreground">{data.tax_id}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </aside>
          </div>
        )}

        {/* ── Chauffeurs ── */}
        {tab === "drivers" && <TabDrivers partnerId={partnerId} />}

        {/* ── Courses ── */}
        {tab === "trips" && <TabTrips partnerId={partnerId} />}

        {/* ── Commissions ── */}
        {tab === "commissions" && <TabCommissions partnerId={partnerId} />}
      </div>

      <ConfirmModal
        open={confirmActivate}
        title={data.status === "suspended" ? "Réactiver ce partenaire ?" : "Approuver ce partenaire ?"}
        message="Le partenaire pourra à nouveau recevoir des courses et gérer ses chauffeurs."
        confirmLabel={data.status === "suspended" ? "Réactiver" : "Approuver"}
        onConfirm={() => setConfirmActivate(false)}
        onCancel={() => setConfirmActivate(false)}
      />

      <ConfirmModal
        open={confirmSuspend}
        title="Suspendre ce partenaire ?"
        message="Le partenaire ne pourra plus recevoir de courses tant que le compte est suspendu."
        confirmLabel="Suspendre"
        variant="danger"
        onConfirm={() => setConfirmSuspend(false)}
        onCancel={() => setConfirmSuspend(false)}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce partenaire ?"
        message="Cette action est irréversible. Le partenaire et toutes ses données associées seront supprimés définitivement."
        confirmLabel="Supprimer définitivement"
        variant="danger"
        onConfirm={() => {
          deletePartner.mutate(partnerId, {
            onSuccess: () => router.push("/franchise/partners"),
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {showEdit && data && <EditPartnerModal data={data} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
