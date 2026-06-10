/**
 * Scan Swagger live — endpoints recharge chauffeur / wallet / transfers
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";

const res = await fetch(`${API}/docs/json`, { signal: AbortSignal.timeout(30000) });
const spec = await res.json();
const paths = Object.keys(spec.paths ?? {});

console.log(`OpenAPI live v${spec.info?.version} — ${paths.length} paths\n`);

function showPath(path) {
  const op = spec.paths[path];
  if (!op) return;
  for (const [m, def] of Object.entries(op)) {
    if (!["get", "post", "put", "patch", "delete"].includes(m)) continue;
    const params = (def.parameters ?? []).map((p) => p.name).join(", ");
    const rb = def.requestBody?.content ? Object.keys(def.requestBody.content).join(", ") : "";
    console.log(`  ${m.toUpperCase()} ${path}`);
    console.log(`    summary: ${def.summary ?? "-"}`);
    if (params) console.log(`    params: ${params}`);
    if (rb) console.log(`    requestBody: ${rb}`);
  }
}

const rechargeKw = /recharge|driver-transfer|driver_transfer|topup|top-up|recharge-batch/i;
const rechargePaths = paths.filter((p) => rechargeKw.test(p)).sort();

console.log("=== Paths recharge / driver-transfer ===");
if (!rechargePaths.length) console.log("(aucun path avec recharge/driver-transfer dans l'URL)");
for (const p of rechargePaths) showPath(p);

const walletPaths = paths.filter((p) => /wallet/i.test(p)).sort();
console.log(`\n=== Tous les paths wallet (${walletPaths.length}) ===`);
for (const p of walletPaths) showPath(p);

const full = JSON.stringify(spec);
const terms = [
  "driver-transfer",
  "driver_transfer",
  "recharge-batch",
  "recharge",
  "DriverTransfer",
  "driverRecharge",
];
console.log("\n=== Occurrences dans le spec ===");
for (const t of terms) {
  const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  console.log(`${t}: ${(full.match(re) ?? []).length}`);
}

// Schemas liés
const schemas = spec.components?.schemas ?? {};
const schemaHits = Object.keys(schemas)
  .filter((n) => /recharge|transfer|wallet/i.test(n))
  .sort();
console.log(`\n=== Schémas wallet/recharge/transfer (${schemaHits.length}) ===`);
for (const n of schemaHits) {
  const props = Object.keys(schemas[n].properties ?? {}).slice(0, 12).join(", ");
  console.log(`- ${n}${props ? ` → ${props}` : ""}`);
}
