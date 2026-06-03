"use client";

import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { formatDateTime } from "@/shared/lib/format";
import { TripForensicMap } from "../components/TripForensicMap";
import { useTripForensic } from "../api/opsExtended.queries";

interface TripForensicPageProps {
  tripId: string;
}

export function TripForensicPage({ tripId }: TripForensicPageProps) {
  const { data, isLoading, isError } = useTripForensic(tripId);

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-card bg-border" />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Données forensic indisponibles.{" "}
        <Link href={`/admin/ops/trips/${tripId}`} className="text-teal underline">
          Retour à la course
        </Link>
      </p>
    );
  }

  const columns: Column<(typeof data.gps_trace)[0]>[] = [
    {
      id: "at",
      header: "Horodatage",
      cell: (p) => formatDateTime(p.at),
      exportValue: (p) => p.at,
    },
    {
      id: "coords",
      header: "Coordonnées",
      cell: (p) => `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`,
      exportValue: (p) => `${p.lat},${p.lng}`,
    },
    {
      id: "speed",
      header: "Vitesse",
      className: "tabular-nums",
      cell: (p) => (
        <span className={p.speed_kmh >= 80 ? "font-medium text-red-600" : ""}>
          {p.speed_kmh} km/h
        </span>
      ),
      exportValue: (p) => p.speed_kmh,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Forensic GPS · ${data.ref}`}
        breadcrumb={["Admin", "Opérations", "Courses", data.ref, "Forensic"]}
      />

      <p className="mb-6 text-sm">
        <Link href={`/admin/ops/trips/${tripId}`} className="text-teal hover:underline">
          ← Retour à la course
        </Link>
        {" · "}
        <span className="text-muted">{data.driver_name}</span>
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-muted">Distance enregistrée</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-heading">
            {data.distance_km} km
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-muted">Durée</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-heading">
            {data.duration_min} min
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-muted">Anomalies</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-heading">
            {data.anomalies.length}
          </p>
        </div>
      </div>

      <TripForensicMap
        trace={data.gps_trace}
        fromCoords={data.from_coords}
        toCoords={data.to_coords}
      />

      {data.anomalies.length > 0 && (
        <ul className="mt-6 space-y-3">
          {data.anomalies.map((a) => (
            <li
              key={a.id}
              className={`rounded-card border p-4 shadow-card ${
                a.severity === "critical"
                  ? "border-red-200 bg-red-50"
                  : a.severity === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : "border-border bg-surface"
              }`}
            >
              <p className="font-medium text-foreground">{a.label}</p>
              <p className="mt-1 text-sm text-muted">{a.description}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-heading">Points GPS</h2>
        <DataTable
          columns={columns}
          data={data.gps_trace}
          rowKey={(p) => p.at}
          exportFileName={`forensic-${data.ref}`}
          emptyTitle="Aucun point"
        />
      </div>
    </div>
  );
}
