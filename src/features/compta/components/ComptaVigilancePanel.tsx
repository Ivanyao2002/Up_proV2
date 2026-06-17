import Link from "next/link";
import { formatFCFA } from "@/shared/lib/format";
import type { ComptaDashboardData } from "../api/comptaPortal.types";

interface VigilanceItem {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: "ok" | "watch" | "alert";
}

function buildItems(data: ComptaDashboardData): VigilanceItem[] {
  const items: VigilanceItem[] = [];

  if (data.reconciliation_open_gaps > 0) {
    items.push({
      id: "recon",
      title: `${data.reconciliation_open_gaps} écart${data.reconciliation_open_gaps > 1 ? "s" : ""} de réconciliation`,
      description: "Rapprochements à traiter ou justifier",
      href: "/compta/reconciliation",
      tone: "alert",
    });
  } else {
    items.push({
      id: "recon-ok",
      title: "Réconciliation à jour",
      description: "Aucun écart ouvert sur la période",
      href: "/compta/reconciliation",
      tone: "ok",
    });
  }

  if (data.withdrawals_pending_count > 0) {
    items.push({
      id: "withdrawals",
      title: `${data.withdrawals_pending_count} retrait${data.withdrawals_pending_count > 1 ? "s" : ""} en attente`,
      description:
        data.withdrawals_pending_fcfa > 0
          ? `${formatFCFA(data.withdrawals_pending_fcfa)} — consultation seule`
          : "Demandes en cours de traitement",
      href: "/compta/withdrawals",
      tone: "watch",
    });
  }

  if (data.reversals_this_month > 0) {
    items.push({
      id: "reversals",
      title: `${data.reversals_this_month} extourne${data.reversals_this_month > 1 ? "s" : ""} ce mois`,
      description: "Écritures inversées sur le journal",
      href: "/compta/ledger",
      tone: "watch",
    });
  }

  if (data.period_label) {
    items.push({
      id: "period",
      title: `Période ${data.period_label}`,
      description: data.period_status
        ? `Statut : ${data.period_status === "open" ? "ouverte" : data.period_status}`
        : "Clôture et verrouillage",
      href: "/compta/periods",
      tone: data.period_status === "open" ? "ok" : "watch",
    });
  }

  return items;
}

const TONE_DOT = {
  ok: "bg-teal/80 ring-teal/25",
  watch: "bg-amber-400/90 ring-amber-400/25",
  alert: "bg-red-400/90 ring-red-400/25",
};

export function ComptaVigilancePanel({ data }: { data: ComptaDashboardData }) {
  const items = buildItems(data);

  return (
    <div className="kpi-card kpi-card--compact kpi-card--slate kpi-card__grain relative flex h-full min-h-[280px] flex-col rounded-card p-5 text-white sm:p-6">
      <div className="kpi-card__pattern kpi-card__pattern--waves" aria-hidden />

      <div className="relative z-[1] flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/65">
          Points de vigilance
        </p>
        <p className="mt-0.5 text-xs text-white/55">Suivi comptable du jour</p>

        <ul className="mt-4 flex flex-1 flex-col divide-y divide-white/10">
          {items.map((item) => {
            const inner = (
              <div className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ring-2 ring-offset-0 ${TONE_DOT[item.tone]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-white/95">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{item.description}</p>
                </div>
                {item.href ? (
                  <span
                    className="mt-0.5 shrink-0 text-xs text-white/40 transition-colors group-hover:text-teal/90"
                    aria-hidden
                  >
                    →
                  </span>
                ) : null}
              </div>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="group block transition-opacity hover:opacity-95">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
