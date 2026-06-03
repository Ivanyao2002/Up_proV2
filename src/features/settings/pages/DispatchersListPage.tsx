"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { SearchInput } from "@/shared/ui/SearchInput";
import { EntityStatusPill } from "@/shared/ui/EntityStatusPill";
import { Button } from "@/shared/ui/Button";
import { usePermission } from "@/core/auth/usePermission";
import type { DispatcherAccount, DispatcherStatus } from "@/shared/types";
import { useDispatchersList } from "../api/dispatchers.queries";
import { lastLoginLabel } from "../lib/lastLoginLabel";
import { useZonesList } from "@/features/network/api/zones.queries";

const STATUS_LABELS: Record<DispatcherStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
};

export function DispatchersListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DispatcherStatus | "all">("all");
  const canCreate = usePermission("settings.dispatchers.create");

  const { data, isLoading, isError } = useDispatchersList();
  const { data: zonesData } = useZonesList();

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (statusFilter !== "all") {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (zoneFilter !== "all") {
      list = list.filter((d) => d.zone_ids.includes(zoneFilter));
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        (d.franchise_name ?? "").toLowerCase().includes(q) ||
        (d.zone_names ?? []).some((z) => z.toLowerCase().includes(q))
    );
  }, [data?.data, search, statusFilter, zoneFilter]);

  const columns: Column<DispatcherAccount>[] = [
    {
      id: "name",
      header: "Nom",
      cell: (d) => (
        <Link
          href={`/admin/settings/dispatchers/${d.id}`}
          className="font-medium text-navy hover:text-teal"
        >
          {d.name}
        </Link>
      ),
      exportValue: (d) => d.name,
    },
    {
      id: "email",
      header: "Email",
      cell: (d) => d.email,
      exportValue: (d) => d.email,
    },
    {
      id: "phone",
      header: "Téléphone",
      cell: (d) => <span className="whitespace-nowrap text-muted">{d.phone}</span>,
      exportValue: (d) => d.phone,
    },
    {
      id: "zones",
      header: "Zones",
      cell: (d) => (
        <span className="text-sm text-muted">
          {(d.zone_names ?? []).join(", ") || "—"}
        </span>
      ),
      exportValue: (d) => (d.zone_names ?? []).join(", "),
    },
    {
      id: "franchise",
      header: "Franchise",
      cell: (d) => d.franchise_name ?? "Plateforme",
      exportValue: (d) => d.franchise_name ?? "Plateforme",
    },
    {
      id: "status",
      header: "Statut",
      cell: (d) => <EntityStatusPill status={d.status} />,
      exportValue: (d) => STATUS_LABELS[d.status],
    },
    {
      id: "last_login",
      header: "Connexion",
      cell: (d) => (
        <span className="text-sm text-muted tabular-nums">
          {lastLoginLabel(d.last_login_at)}
        </span>
      ),
      exportValue: (d) => lastLoginLabel(d.last_login_at),
    },
    {
      id: "actions",
      header: "",
      cell: (d) => (
        <Link
          href={`/admin/settings/dispatchers/${d.id}`}
          className="text-sm text-teal hover:underline"
        >
          Voir
        </Link>
      ),
      exportValue: () => "",
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-red-600">Impossible de charger les dispatchers.</p>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Dispatchers"
        breadcrumb={["Admin", "Paramètres"]}
        actions={
          canCreate ? (
            <Button onClick={() => router.push("/admin/settings/dispatchers/new")}>
              + Nouveau
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Nom, email, zone…"
          />
        </div>
        <select
          value={zoneFilter === "all" ? "all" : String(zoneFilter)}
          onChange={(e) =>
            setZoneFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
        >
          <option value="all">Toutes les zones</option>
          {(zonesData?.data ?? []).map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as DispatcherStatus | "all")
          }
          className="rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        exportFileName="dispatchers"
        emptyTitle="Aucun dispatcher"
        footer={
          data?.meta ? <span>{data.meta.total} comptes dispatch</span> : undefined
        }
      />
    </div>
  );
}
