"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { TableFiltersBar } from "@/shared/ui/TableFiltersBar";
import { useListFiltersReset } from "@/shared/hooks/useListFiltersReset";
import {
  serverPaginationFromMeta,
  useServerTableState,
} from "@/shared/hooks/useServerTableState";

// Icônes SVG inline
const IconNavigation = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>;
const IconTruck = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M14 6h7l3 4v8a1 1 0 0 1-1 1h-3"/><circle cx="5" cy="18" r="3"/><circle cx="17" cy="18" r="3"/></svg>;
const IconCar = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>;
const IconAlertCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconMapPin = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;

interface TrackingMission {
  id: string;
  ref: string;
  type: "freight" | "rental";
  vehicle_label: string;
  driver_name?: string;
  status: "active" | "paused" | "completed" | "alert";
  last_position?: {
    lat: number;
    lng: number;
    timestamp: string;
    address?: string;
  };
  start_time: string;
  estimated_end?: string;
  alerts?: string[];
}

export function PartnerTrackingPage() {
  const table = useServerTableState([]);
  const [selectedMission, setSelectedMission] = useState<TrackingMission | null>(null);

  const { hasActiveFilters, resetAll } = useListFiltersReset({
    search: { value: table.search, set: table.setSearch },
  });

  // Mock data
  const missions: TrackingMission[] = [
    {
      id: "1",
      ref: "FRT-2026-001",
      type: "freight",
      vehicle_label: "Mercedes Sprinter",
      driver_name: "Koné Amadou",
      status: "active",
      last_position: {
        lat: 5.36,
        lng: -4.01,
        timestamp: "2026-06-16T14:30:00Z",
        address: "Autoroute du Nord, 15 km de Yamoussoukro",
      },
      start_time: "2026-06-16T08:00:00Z",
      estimated_end: "2026-06-16T16:00:00Z",
    },
    {
      id: "2",
      ref: "LOC-2026-002",
      type: "rental",
      vehicle_label: "Toyota Corolla",
      driver_name: "Bamba Koffi",
      status: "paused",
      last_position: {
        lat: 5.32,
        lng: -4.02,
        timestamp: "2026-06-16T12:15:00Z",
        address: "Zone industrielle, Treichville",
      },
      start_time: "2026-06-16T09:00:00Z",
    },
  ];

  const statusConfig = {
    active: { label: "En mouvement", color: "bg-green-100 text-green-700", icon: "navigation" },
    paused: { label: "Arrêté", color: "bg-yellow-100 text-yellow-700", icon: "clock" },
    completed: { label: "Terminé", color: "bg-gray-100 text-gray-700", icon: "mapPin" },
    alert: { label: "Alerte", color: "bg-red-100 text-red-700", icon: "alertCircle" },
  };

  const columns: Column<TrackingMission>[] = [
    {
      id: "ref",
      header: "Mission",
      cell: (m) => (
        <div>
          <div className="font-medium">{m.ref}</div>
          <div className="text-xs text-muted">{m.type === "freight" ? "Fret" : "Location"}</div>
        </div>
      ),
    },
    {
      id: "vehicle",
      header: "Véhicule",
      cell: (m) => (
        <div className="flex items-center gap-2">
          {m.type === "freight" ? <IconTruck /> : <IconCar />}
          <span>{m.vehicle_label}</span>
        </div>
      ),
    },
    {
      id: "driver",
      header: "Chauffeur",
      cell: (m) => <span className="text-sm">{m.driver_name || "Non assigné"}</span>,
    },
    {
      id: "status",
      header: "Statut",
      cell: (m) => {
        const config = statusConfig[m.status];
        const IconComponent = config.icon === 'navigation' ? IconNavigation : config.icon === 'clock' ? IconClock : config.icon === 'mapPin' ? IconMapPin : IconAlertCircle;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.color}`}>
            <IconComponent />
            {config.label}
          </span>
        );
      },
    },
    {
      id: "location",
      header: "Dernière position",
      cell: (m) => (
        m.last_position ? (
          <div className="text-sm">
            <div className="text-muted truncate max-w-[200px]">{m.last_position.address || "Position inconnue"}</div>
            <div className="text-xs text-muted">
              {new Date(m.last_position.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <span className="text-sm text-muted">-</span>
        )
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (m) => (
        <Button
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          onClick={() => setSelectedMission(m)}
        >
          Voir carte
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title="Tracking GPS"
        breadcrumb={["Partenaire", "Tracking"]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <TableFiltersBar
            search={table.search}
            onSearchChange={table.setSearch}
            searchPlaceholder="Référence, véhicule, chauffeur..."
            hasActiveFilters={hasActiveFilters}
            onReset={resetAll}
          />

          <DataTable
            columns={columns}
            data={missions}
            rowKey={(m) => m.id}
            isLoading={false}
            emptyTitle="Aucune mission active"
            emptyDescription="Les missions en cours apparaîtront ici"
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-surface p-6 shadow-card">
            <h3 className="font-semibold mb-4">Carte en temps réel</h3>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center text-muted">
                <IconNavigation />
                <p>Sélectionnez une mission</p>
                <p className="text-sm">pour voir sa position</p>
              </div>
            </div>
            {selectedMission && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">{selectedMission.ref}</h4>
                <p className="text-sm text-muted mt-1">
                  {selectedMission.last_position?.address || "Position non disponible"}
                </p>
                <div className="mt-2 text-xs text-muted">
                  Mis à jour: {selectedMission.last_position?.timestamp 
                    ? new Date(selectedMission.last_position.timestamp).toLocaleTimeString()
                    : "N/A"}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-card bg-surface p-6 shadow-card">
            <h3 className="font-semibold mb-4">Légende</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span>En mouvement</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Arrêt prolongé</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Alerte (hors zone)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
