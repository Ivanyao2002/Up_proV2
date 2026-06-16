"use client";

import Link from "next/link";

const LINKS = [
  { href: "/admin/finance/transactions", label: "Transactions" },
  { href: "/admin/finance/ledger", label: "Ledger" },
  { href: "/admin/finance/withdrawals", label: "Retraits" },
  { href: "/admin/finance/wallets", label: "Portefeuilles" },
  { href: "/admin/finance/commissions", label: "Commissions" },
  { href: "/admin/finance/bonus-rules", label: "Règles bonus" },
  { href: "/admin/finance/reconciliation", label: "Réconciliation" },
  { href: "/admin/finance/driver-transfers", label: "Recharges chauffeurs" },
] as const;

export function FinanceQuickLinks() {
  return (
    <nav
      className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted"
      aria-label="Raccourcis finance"
    >
      {LINKS.map((link, index) => (
        <span key={link.href} className="inline-flex items-center">
          {index > 0 && <span className="mx-2 text-border" aria-hidden>·</span>}
          <Link
            href={link.href}
            className="font-medium text-muted transition-colors hover:text-teal"
          >
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
