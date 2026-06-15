import { formatFCFA } from "@/shared/lib/format";
import type { FranchiseDashboard } from "../api/dashboard.service";

interface FranchisePendingWithdrawalsKpiProps {
  pending: FranchiseDashboard["pending_withdrawals"];
}

export function FranchisePendingWithdrawalsKpi({
  pending,
}: FranchisePendingWithdrawalsKpiProps) {
  return (
    <div className="kpi-card kpi-card--compact kpi-card--deep-teal kpi-card__grain relative rounded-card p-4 text-white sm:p-5">
      <div className="kpi-card__pattern kpi-card__pattern--mesh" aria-hidden />
      <div className="relative z-[1]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
          Retraits en attente
        </p>

        <p className="kpi-card__value mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">
          {formatFCFA(pending.total_fcfa)}
        </p>

        <p className="mt-1 text-xs leading-snug text-white/75">
          Demandes de retrait · territoire
        </p>

        <p className="mt-1.5 text-xs text-white/70">
          <span className="font-semibold text-white">Partenaires</span>
          {" · "}
          <span className="tabular-nums text-white">
            {formatFCFA(pending.partners_fcfa)}
          </span>
          {" "}
          <span className="text-white/60">
            ({pending.partners_requests_count} demande
            {pending.partners_requests_count > 1 ? "s" : ""})
          </span>
        </p>

        <p className="mt-1 text-xs text-white/70">
          <span className="font-semibold text-white">Chauffeurs</span>
          {" · "}
          <span className="tabular-nums text-white">
            {formatFCFA(pending.drivers_fcfa)}
          </span>
          {" "}
          <span className="text-white/60">
            ({pending.drivers_requests_count} demande
            {pending.drivers_requests_count > 1 ? "s" : ""})
          </span>
        </p>
      </div>
    </div>
  );
}
