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
  "support.tickets.view",
  "support.chat.view",
  "support.anomalies.view",
  "reporting.dashboard.view",
  "reporting.activity.view",
  "reporting.finance.view",
  "reporting.quality.view",
  "reporting.governance.view",
  "reporting.exports.view",
  "settings.audit.view",
];

export const COMPTA_PORTAL_PERMISSIONS: string[] = [
  "finance.transactions.view",
  "finance.wallets.view",
];

export const SUPPORT_PORTAL_PERMISSIONS: string[] = [
  "support.tickets.view",
  "support.chat.view",
  "support.anomalies.view",
  "ops.trips.view",
];

export const REPORTING_PORTAL_PERMISSIONS: string[] = [
  "reporting.dashboard.view",
  "reporting.activity.view",
  "reporting.finance.view",
  "reporting.quality.view",
  "reporting.governance.view",
  "reporting.exports.view",
];
