import type { NavGroup } from "@/portals/shared/navTypes";

export const COMPTA_NAV: NavGroup[] = [
  {
    group: "COMPTABILITÉ",
    items: [
      {
        label: "Tableau de bord",
        path: "/compta",
        icon: "dashboard",
        permission: "finance.transactions.view",
      },
      {
        label: "Flux entrées / sorties",
        path: "/compta/flows",
        icon: "transactions",
        permission: "finance.transactions.view",
      },
      {
        label: "Journal comptable",
        path: "/compta/ledger",
        icon: "finance",
        permission: "finance.transactions.view",
      },
      {
        label: "Commissions & bénéfices",
        path: "/compta/commissions",
        icon: "commissions",
        permission: "finance.transactions.view",
      },
      {
        label: "Portefeuilles",
        path: "/compta/wallets",
        icon: "wallet",
        permission: "finance.wallets.view",
      },
      {
        label: "Réconciliation",
        path: "/compta/reconciliation",
        icon: "reconciliation",
        permission: "finance.transactions.view",
      },
      {
        label: "Clôtures & périodes",
        path: "/compta/periods",
        icon: "reports",
        permission: "finance.transactions.view",
      },
    ],
  },
  {
    group: "CONSULTATION",
    items: [
      {
        label: "Transactions",
        path: "/compta/transactions",
        icon: "transactions",
        permission: "finance.transactions.view",
      },
      {
        label: "Retraits",
        path: "/compta/withdrawals",
        icon: "withdrawals",
        permission: "finance.transactions.view",
      },
      {
        label: "Recharges chauffeurs",
        path: "/compta/recharges",
        icon: "wallet-transfer",
        permission: "finance.transactions.view",
      },
    ],
  },
  {
    group: "ACTIONS",
    items: [
      {
        label: "Rapports & exports",
        path: "/compta/exports",
        icon: "reports",
        permission: "finance.transactions.view",
      },
      {
        label: "Finance opérationnelle",
        path: "/admin/finance",
        icon: "finance",
        permission: "finance.transactions.view",
      },
    ],
  },
];
