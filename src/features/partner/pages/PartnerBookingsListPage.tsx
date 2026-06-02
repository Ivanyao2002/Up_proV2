"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { StatusPill } from "@/shared/ui/StatusPill";
import { Button } from "@/shared/ui/Button";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import { getTripStatusLabel } from "@/shared/lib/tripLabels";
import type { PartnerBooking } from "../api/bookings.service";
import { usePartnerBookingsList } from "../api/bookings.queries";

export function PartnerBookingsListPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = usePartnerBookingsList();

  const rows = useMemo(() => {
    const list = data?.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (b) =>
        b.ref.toLowerCase().includes(q) ||
        b.client_name.toLowerCase().includes(q) ||
        b.from_label.toLowerCase().includes(q) ||
        b.to_label.toLowerCase().includes(q) ||
        (b.driver_name?.toLowerCase().includes(q) ?? false)
    );
  }, [data?.data, search]);

  const columns: Column<PartnerBooking>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (b) => (
        <Link
          href={`/partner/bookings/${b.id}`}
          className="font-medium text-navy hover:text-teal"
        >
          {b.ref}
        </Link>
      ),
      exportValue: (b) => b.ref,
    },
    {
      id: "route",
      header: "Trajet",
      cell: (b) => (
        <div className="min-w-[200px]">
          <p className="text-sm text-[#212529]">{b.from_label}</p>
          <p className="text-xs text-muted">→ {b.to_label}</p>
        </div>
      ),
      exportValue: (b) => `${b.from_label} → ${b.to_label}`,
    },
    {
      id: "client",
      header: "Client",
      cell: (b) => (
        <div>
          <p className="text-sm">{b.client_name}</p>
          {b.client_phone && <p className="text-xs text-muted">{b.client_phone}</p>}
        </div>
      ),
      exportValue: (b) => b.client_phone ? `${b.client_name} (${b.client_phone})` : b.client_name,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (b) => b.driver_name ?? "—",
      exportValue: (b) => b.driver_name ?? "",
    },
    {
      id: "amount",
      header: "Montant",
      cell: (b) => formatFCFA(b.amount_fcfa),
      exportValue: (b) => b.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (b) => <StatusPill status={b.status} pulse={b.status === "in_progress"} />,
      exportValue: (b) => getTripStatusLabel(b.status),
    },
    {
      id: "date",
      header: "Créée le",
      cell: (b) => (
        <span className="text-xs text-muted whitespace-nowrap">
          {formatDateTime(b.created_at)}
        </span>
      ),
      exportValue: (b) => formatDateTime(b.created_at),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les réservations.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Réservations"
        breadcrumb={["Partenaire", "Courses"]}
        actions={
          <Link href="/partner/bookings/new">
            <Button>Nouvelle réservation</Button>
          </Link>
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Réf., client, adresse, chauffeur…"
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        exportFileName="reservations-partenaire"
        emptyTitle="Aucune réservation"
        emptyDescription="Créez une course manuelle pour votre flotte."
        footer={
          data?.meta ? (
            <span>{data.meta.total} réservations enregistrées</span>
          ) : undefined
        }
      />
    </div>
  );
}
