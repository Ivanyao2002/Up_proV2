import type { Trip } from "@/shared/types";
import { formatFCFA } from "@/shared/lib/format";
import { StatusPill } from "@/shared/ui/StatusPill";

interface RecentTripsTableProps {
  trips: Trip[];
}

export function RecentTripsTable({ trips }: RecentTripsTableProps) {
  return (
    <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-sm font-semibold text-[#212529]">Activité récente</h2>
        <p className="text-xs text-muted">Dernières courses sur la plateforme</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-6 py-3 font-medium">Réf.</th>
              <th className="px-6 py-3 font-medium">Trajet</th>
              <th className="px-6 py-3 font-medium">Client</th>
              <th className="px-6 py-3 font-medium">Montant</th>
              <th className="px-6 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr
                key={trip.id}
                className="h-[52px] border-t border-border/50 transition-colors duration-120 hover:bg-canvas/80"
              >
                <td className="px-6 font-medium text-navy">{trip.ref}</td>
                <td className="px-6 text-muted">
                  <span className="block text-[#212529]">{trip.from_label}</span>
                  <span className="text-xs">→ {trip.to_label}</span>
                </td>
                <td className="px-6">{trip.client_name}</td>
                <td className="px-6 tabular-nums">{formatFCFA(trip.amount_fcfa)}</td>
                <td className="px-6">
                  <StatusPill
                    status={trip.status}
                    pulse={trip.status === "in_progress"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
