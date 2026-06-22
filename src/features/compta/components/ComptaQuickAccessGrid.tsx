import Link from "next/link";
import { NavIcon, type NavIconName } from "@/portals/shared/NavIcon";

const QUICK_ACCESS: {
  href: string;
  label: string;
  description: string;
  icon: NavIconName;
}[] = [
  {
    href: "/compta/ledger",
    label: "Journal comptable",
    description: "Écritures immuables et extournes",
    icon: "finance",
  },
  {
    href: "/compta/flows",
    label: "Flux entrées / sorties",
    description: "Agrégation par nature d'écriture",
    icon: "transactions",
  },
  {
    href: "/compta/wallets",
    label: "Portefeuilles",
    description: "Soldes retirable et service",
    icon: "wallet",
  },
  {
    href: "/compta/reconciliation",
    label: "Réconciliation",
    description: "Paiements et écarts cash",
    icon: "reconciliation",
  },
  {
    href: "/compta/periods",
    label: "Clôtures & périodes",
    description: "Fermeture et verrouillage",
    icon: "reports",
  },
  {
    href: "/compta/withdrawals",
    label: "Retraits",
    description: "Suivi des demandes en cours",
    icon: "withdrawals",
  },
  {
    href: "/compta/commissions",
    label: "Commissions",
    description: "Prélèvements plateforme",
    icon: "commissions",
  },
  {
    href: "/compta/exports",
    label: "Exports",
    description: "CSV et rapports",
    icon: "reports",
  },
];

export function ComptaQuickAccessGrid() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-heading">Accès rapides</h2>
        <p className="mt-0.5 text-xs text-muted">Modules comptables du périmètre</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACCESS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex gap-3 rounded-card border border-border bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/35 hover:shadow-lg"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal/10 text-teal-dark transition-colors group-hover:bg-teal/15">
              <NavIcon name={item.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground group-hover:text-teal-dark">
                  {item.label}
                </span>
                <span
                  className="text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                >
                  →
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted">
                {item.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
