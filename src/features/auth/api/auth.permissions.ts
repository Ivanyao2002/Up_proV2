/** Permissions sidebar portail franchise (alignées `franchiseNav.ts`). */
export const FRANCHISE_BACKOFFICE_PERMISSIONS: string[] = [
  "ops.dashboard.view",
  "ops.map.view",
  "ops.trips.view",
  "ops.dispatch.view",
  "network.partners.view",
  "fleet.drivers.view",
  "fleet.kyc.approve",
  "finance.wallets.view",
  "settings.dispatchers.view",
];

/** Permissions sidebar portail partenaire (alignées `partnerNav.ts`). */
export const PARTNER_BACKOFFICE_PERMISSIONS: string[] = [
  "ops.dashboard.view",
  "ops.trips.view",
  "ops.map.view",
  "fleet.drivers.view",
  "finance.wallets.view",
];

/** Permissions sidebar portail comptable (alignées `comptaNav.ts`). */
export const COMPTA_BACKOFFICE_PERMISSIONS: string[] = [
  "finance.transactions.view",
  "finance.ledger.view",
  "finance.wallets.view",
  "finance.commissions.view",
  "finance.reconciliation.view",
  "accounting.export",
  "accounting.reverse",
  "accounting.periods.close",
  "accounting.periods.lock",
  "accounting.entries.classify",
  "ops.dashboard.view",
];

/** Permissions back-office admin (alignées mock jusqu'à endpoint dédié API). */
export const ADMIN_BACKOFFICE_PERMISSIONS: string[] = [
  "ops.dashboard.view",
  "ops.map.view",
  "ops.trips.view",
  "ops.trips.edit",
  "ops.dispatch.view",
  "ops.dispatch.assign",
  "network.franchises.view",
  "network.zones.view",
  "network.partners.view",
  "fleet.drivers.view",
  "fleet.drivers.status.bulk",
  "fleet.drivers.ban",
  "fleet.kyc.approve",
  "fleet.clients.view",
  "finance.transactions.view",
  "finance.withdrawals.approve",
  "finance.wallets.view",
  "settings.roles.manage",
  "settings.dispatchers.view",
  "settings.dispatchers.create",
  "settings.dispatchers.edit",
  "settings.dispatch_rules.view",
  "settings.dispatch_rules.edit",
  "settings.pricing.view",
];
