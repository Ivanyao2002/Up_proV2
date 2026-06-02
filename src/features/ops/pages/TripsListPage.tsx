"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { FilterChips } from "@/shared/ui/FilterChips";
import { StatusPill } from "@/shared/ui/StatusPill";
import { ServicePill } from "@/shared/ui/ServicePill";
import { formatFCFA, formatDateTime } from "@/shared/lib/format";
import {
  getServiceLabel,
  getTripStatusLabel,
  STATUS_FILTER_OPTIONS,
} from "@/shared/lib/tripLabels";
import type { Trip, TripStatus } from "@/shared/types";
import { useTripsList } from "../api/trips.queries";

export function TripsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const { data, isLoading, isError } = useTripsList(statusFilter);

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (t) =>
        t.ref.toLowerCase().includes(q) ||
        t.client_name.toLowerCase().includes(q) ||
        (t.driver_name?.toLowerCase().includes(q) ?? false) ||
        t.from_label.toLowerCase().includes(q) ||
        t.to_label.toLowerCase().includes(q)
    );
  }, [data?.data, search, statusFilter]);

  const columns: Column<Trip>[] = [
    {
      id: "ref",
      header: "Réf.",
      cell: (t) => (
        <Link
          href={`/admin/ops/trips/${t.id}`}
          className="font-medium text-navy hover:text-teal"
        >
          {t.ref}
        </Link>
      ),
      exportValue: (t) => t.ref,
    },
    {
      id: "service",
      header: "Service",
      cell: (t) => <ServicePill service={t.service} />,
      exportValue: (t) => getServiceLabel(t.service),
    },
    {
      id: "route",
      header: "Trajet",
      cell: (t) => (
        <div className="max-w-[220px]">
          <span className="block truncate text-[#212529]">{t.from_label}</span>
          <span className="block truncate text-xs text-muted">→ {t.to_label}</span>
        </div>
      ),
      exportValue: (t) => `${t.from_label} → ${t.to_label}`,
    },
    {
      id: "client",
      header: "Client",
      cell: (t) => t.client_name,
      exportValue: (t) => t.client_name,
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (t) => t.driver_name ?? "—",
      exportValue: (t) => t.driver_name ?? "",
    },
    {
      id: "amount",
      header: "Montant",
      className: "tabular-nums whitespace-nowrap",
      cell: (t) => formatFCFA(t.amount_fcfa),
      exportValue: (t) => t.amount_fcfa,
    },
    {
      id: "status",
      header: "Statut",
      cell: (t) => (
        <StatusPill status={t.status} pulse={t.status === "in_progress"} />
      ),
      exportValue: (t) => getTripStatusLabel(t.status),
    },
    {
      id: "date",
      header: "Date",
      className: "text-muted whitespace-nowrap",
      cell: (t) => formatDateTime(t.created_at),
      exportValue: (t) => formatDateTime(t.created_at),
    },
  ];

  if (isError) {
    return <p className="text-sm text-red-600">Impossible de charger les courses.</p>;
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Courses" breadcrumb={["Admin", "Opérations"]} />

      <div className="mb-4 space-y-4">
        <FilterChips
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Réf., client, chauffeur, adresse…"
          />
          {data?.meta && (
            <span className="text-sm text-muted">
              {data.meta.total.toLocaleString("fr-CI")} courses aujourd&apos;hui
            </span>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(t) => t.id}
        isLoading={isLoading}
        exportFileName="courses"
        emptyTitle="Aucune course"
        emptyDescription="Aucun résultat pour ces filtres."
        footer={
          data?.meta ? (
            <>
              <span>
                Page {data.meta.current_page} / {data.meta.last_page}
              </span>
              <span>{rows.length} affichée(s)</span>
            </>
          ) : undefined
        }
      />
    </div>
  );
}
