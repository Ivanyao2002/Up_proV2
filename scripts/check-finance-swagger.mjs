import fs from "fs";

const SWAGGER_URL = "https://api.upjunoo-dev.tech/docs/json";

const res = await fetch(SWAGGER_URL);
const spec = await res.json();
const paths = Object.keys(spec.paths ?? {}).sort();

const FRONT_ROUTES = [
  { label: "Plafonds finance", method: "GET", path: "/v1/admin/settings/finance-caps", usedBy: "FinanceCapsPage" },
  { label: "Plafonds finance", method: "PUT", path: "/v1/admin/settings/finance-caps", usedBy: "FinanceCapsPage" },
  { label: "Ledger admin", method: "GET", path: "/v1/admin/finance/ledger", usedBy: "LedgerListPage" },
  { label: "Bonus rules list", method: "GET", path: "/v1/admin/bonus-rules", usedBy: "BonusRulesListPage" },
  { label: "Bonus awards", method: "GET", path: "/v1/admin/bonus-awards", usedBy: "(prévu, pas branché UI)" },
  { label: "Wallets admin", method: "GET", path: "/v1/admin/finance/wallets", usedBy: "WalletsListPage" },
  { label: "Transactions admin", method: "GET", path: "/v1/admin/finance/transactions", usedBy: "LedgerListPage (fallback)" },
  { label: "Wallet chauffeur", method: "GET", path: "/v1/drivers/{driverId}/wallet", usedBy: "DriverDetailPage" },
  { label: "Ledger chauffeur", method: "GET", path: "/v1/drivers/{driverId}/ledger", usedBy: "DriverDetailPage" },
  { label: "Wallet partenaire", method: "GET", path: "/v1/partners/{id}/wallet", usedBy: "PartnerDetailPage" },
  { label: "Ledger partenaire", method: "GET", path: "/v1/partners/{id}/ledger", usedBy: "PartnerDetailPage" },
  { label: "Wallet franchise", method: "GET", path: "/v1/admin/franchises/{id}/wallet", usedBy: "FranchiseDetailPage" },
  { label: "Wallet franchise (alt)", method: "GET", path: "/v1/franchises/{id}/wallet", usedBy: "FranchiseDetailPage" },
  { label: "Détail course admin", method: "GET", path: "/v1/admin/orders/{id}", usedBy: "TripFinancePanel" },
];

function normalize(p) {
  return p.replace(/\{[^}]+\}/g, "{id}");
}

function pathExists(routePath, method) {
  const norm = normalize(routePath);
  for (const p of paths) {
    if (normalize(p) !== norm) continue;
    if (spec.paths[p]?.[method.toLowerCase()]) return p;
  }
  return null;
}

const FIELD_PROPS = [
  "withdrawable_balance_xof",
  "withdrawableBalanceXof",
  "non_withdrawable_balance_xof",
  "nonWithdrawableBalanceXof",
  "commissionBreakdown",
  "commission_breakdown",
  "walletBeforeXof",
  "wallet_before_xof",
  "walletAfterXof",
  "wallet_after_xof",
  "cashReceivedXof",
  "cash_received_xof",
];

function schemaHasFields(schemaName, seen = new Set()) {
  if (!schemaName || seen.has(schemaName)) return [];
  seen.add(schemaName);
  const schema = spec.components?.schemas?.[schemaName];
  if (!schema) return [];
  const text = JSON.stringify(schema);
  const hits = FIELD_PROPS.filter((f) => text.includes(f));
  for (const part of schema.allOf ?? []) {
    if (part.$ref) hits.push(...schemaHasFields(part.$ref.split("/").pop(), seen));
  }
  for (const val of Object.values(schema.properties ?? {})) {
    if (val?.$ref) hits.push(...schemaHasFields(val.$ref.split("/").pop(), seen));
    if (val?.items?.$ref) hits.push(...schemaHasFields(val.items.$ref.split("/").pop(), seen));
  }
  return [...new Set(hits)];
}

function getOpSchema(pathKey, method) {
  const op = spec.paths[pathKey]?.[method.toLowerCase()];
  const schema = op?.responses?.["200"]?.content?.["application/json"]?.schema;
  if (!schema) return null;
  if (schema.$ref) return schema.$ref.split("/").pop();
  if (schema.properties?.wallet?.$ref) return schema.properties.wallet.$ref.split("/").pop();
  if (schema.properties?.items?.items?.$ref) return schema.properties.items.items.$ref.split("/").pop();
  return "(inline)";
}

console.log("Swagger:", SWAGGER_URL, "| version:", spec.info?.version);
console.log("\n## Routes front vs Swagger\n");

const missing = [];
const present = [];

for (const r of FRONT_ROUTES) {
  const found = pathExists(r.path, r.method);
  const row = { ...r, swaggerPath: found };
  if (found) present.push(row);
  else missing.push(row);
}

console.log("### ABSENTES du Swagger");
for (const r of missing) {
  console.log(`- [${r.method}] ${r.path} — ${r.label} (${r.usedBy})`);
}

console.log("\n### PRÉSENTES dans le Swagger");
for (const r of present) {
  console.log(`- [${r.method}] ${r.swaggerPath} — ${r.label} (${r.usedBy})`);
}

console.log("\n## Champs 2 soldes / finance course dans les schémas\n");

const endpointsToCheck = [
  ["/v1/admin/finance/wallets", "get"],
  ["/v1/drivers/{driverId}/wallet", "get"],
  ["/v1/partners/{id}/wallet", "get"],
  ["/v1/franchises/{id}/wallet", "get"],
  ["/v1/admin/orders/{id}", "get"],
];

for (const [ep, method] of endpointsToCheck) {
  const real = pathExists(ep, method);
  if (!real) {
    console.log(`${ep}: route absente`);
    continue;
  }
  const schema = getOpSchema(real, method);
  const fields = schemaHasFields(schema);
  console.log(`${real} [${schema}]:`, fields.length ? fields.join(", ") : "AUCUN champ withdrawable/breakdown/receipt");
}

console.log("\n## Tous les chemins admin settings");
paths.filter((p) => p.includes("/admin/settings")).forEach((p) => console.log(p));
