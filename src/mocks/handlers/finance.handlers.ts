import { http, HttpResponse } from "msw";
import withdrawals from "../data/withdrawals.json";
import financeWallets from "../data/finance-wallets.json";
import financeCommissions from "../data/finance-commissions.json";
import financeReconciliation from "../data/finance-reconciliation.json";
import {
  TRANSACTIONS_CATALOG,
  filterTransactions,
} from "../lib/transactionsCatalog";
import { paginatedList, parseListQuery, matchesSearch } from "../lib/listQuery";
import { buildAdminFinanceDashboard } from "../lib/adminFinanceDashboardBuilder";
import { getTripsScopeFilterOptions } from "../lib/tripsScope";
import type {
  CommissionRow,
  CommissionsListResponse,
} from "@/features/finance/api/commissions.service";
import type {
  PlatformDriverRechargeStats,
  PlatformDriverTransfer,
  Withdrawal,
} from "@/shared/types";
import driverTransfersPlatformSeed from "../data/driver-wallet-transfers-platform.json";

const withdrawalsData = withdrawals.data as Withdrawal[];

const platformTransfersSeed = driverTransfersPlatformSeed as {
  stats: PlatformDriverRechargeStats;
  data: PlatformDriverTransfer[];
};

let platformDriverTransfers: PlatformDriverTransfer[] = [
  ...platformTransfersSeed.data,
];
let platformRechargeStats: PlatformDriverRechargeStats = {
  ...platformTransfersSeed.stats,
};

function filterWithdrawals(rows: Withdrawal[], query: ReturnType<typeof parseListQuery>) {
  let list = rows.filter((w) =>
    matchesSearch(query.search, w.id, w.owner_name, w.franchise_name, w.account_label)
  );
  if (query.status) {
    list = list.filter((w) => w.status === query.status);
  }
  return list;
}

function filterWallets(rows: typeof financeWallets.data, query: ReturnType<typeof parseListQuery>) {
  let list = rows.filter((w) =>
    matchesSearch(query.search, w.owner_name, w.owner_type, w.id, w.franchise_name)
  );
  if (query.type) {
    list = list.filter((w) => w.owner_type === query.type);
  }
  return list;
}

export const financeHandlers = [
  http.get("*/api/v2/admin/finance/dashboard", ({ request }) => {
    const url = new URL(request.url);
    const raw = url.searchParams.get("franchise_id");
    const franchiseId = raw ? Number(raw) : null;
    return HttpResponse.json(
      buildAdminFinanceDashboard(
        franchiseId != null && Number.isFinite(franchiseId) ? franchiseId : null
      )
    );
  }),

  http.get("*/api/v2/admin/finance/transactions", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterTransactions(TRANSACTIONS_CATALOG, query);
    return HttpResponse.json({
      ...paginatedList(filtered, query),
      summary: {
        volume_today_fcfa: 0,
        credits_today_fcfa: 0,
        debits_today_fcfa: 0,
      },
      filter_options: getTripsScopeFilterOptions(),
    });
  }),

  http.get("*/api/v2/admin/finance/wallets", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterWallets(financeWallets.data, query);
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/admin/finance/ledger", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterTransactions(TRANSACTIONS_CATALOG, query);
    return HttpResponse.json({
      ...paginatedList(filtered, query),
      summary: {
        volume_today_fcfa: 0,
        credits_today_fcfa: 0,
        debits_today_fcfa: 0,
      },
    });
  }),

  http.get("*/api/v2/admin/finance/bonus-rules", ({ request }) => {
    const query = parseListQuery(request);
    const seed = [
      {
        id: "BR-001",
        name: "Palier 50 courses / semaine",
        scope: "driver",
        metric: "trips_completed_week",
        threshold_value: 50,
        reward_xof: 5_000,
        status: "active",
      },
      {
        id: "BR-002",
        name: "Objectif CA partenaire",
        scope: "partner",
        metric: "revenue_month_xof",
        threshold_value: 1_000_000,
        reward_xof: 25_000,
        status: "draft",
      },
    ];
    return HttpResponse.json(paginatedList(seed, query));
  }),

  http.get("*/api/v2/admin/finance/commissions", ({ request }) => {
    const query = parseListQuery(request);
    let filtered = (financeCommissions.data as CommissionRow[]).filter((c) =>
      matchesSearch(query.search, c.franchise_name, c.period_label, c.id)
    );
    if (query.status) {
      filtered = filtered.filter((c) => c.status === query.status);
    }
    if (query.franchise_id != null) {
      filtered = filtered.filter((c) => c.franchise_id === query.franchise_id);
    }
    const body: CommissionsListResponse = {
      ...paginatedList(filtered, query),
      filter_options: getTripsScopeFilterOptions(),
    };
    return HttpResponse.json(body);
  }),

  http.get("*/api/v2/admin/finance/reconciliation", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = financeReconciliation.data.filter((r) =>
      matchesSearch(query.search, r.date_label, r.source, r.id)
    );
    if (query.status) {
      return HttpResponse.json(
        paginatedList(
          filtered.filter((r) => r.status === query.status),
          query
        )
      );
    }
    return HttpResponse.json(paginatedList(filtered, query));
  }),

  http.get("*/api/v2/admin/finance/withdrawals", ({ request }) => {
    const query = parseListQuery(request);
    const filtered = filterWithdrawals(withdrawalsData, query);
    const page = paginatedList(filtered, query);
    return HttpResponse.json({ ...page, summary: withdrawals.summary });
  }),

  http.post("*/api/v2/admin/finance/withdrawals/:id/approve", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v2/admin/finance/withdrawals/:id/reject", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get("*/api/v2/admin/finance/driver-transfers/stats", () => {
    return HttpResponse.json(platformRechargeStats);
  }),

  http.get("*/api/v2/admin/finance/driver-transfers", ({ request }) => {
    const query = parseListQuery(request);
    let list = platformDriverTransfers.filter((t) =>
      matchesSearch(
        query.search,
        t.ref,
        t.driver_name,
        t.driver_phone,
        t.owner_name,
        t.note ?? ""
      )
    );
    if (query.type && query.type !== "all") {
      list = list.filter((t) => t.source === query.type);
    }
    if (query.status && query.status !== "all") {
      list = list.filter((t) => t.status === query.status);
    }
    return HttpResponse.json(paginatedList(list, query));
  }),
];
