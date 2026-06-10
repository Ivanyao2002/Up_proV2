/**
 * Vérifie le Swagger live vs demandes DEMANDES-2026-06-10.md (lecture seule).
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";

const specRes = await fetch(`${API}/docs/json`);
const spec = await specRes.json();
console.log(`OpenAPI live v${spec.info?.version} — ${Object.keys(spec.paths).length} paths\n`);

function showPath(path) {
  const op = spec.paths[path];
  if (!op) {
    console.log(`ABSENT: ${path}`);
    return false;
  }
  for (const [m, def] of Object.entries(op)) {
    if (!["get", "post", "put", "patch", "delete"].includes(m)) continue;
    const params = (def.parameters ?? []).map((p) => {
      const en = p.schema?.enum ? ` [${p.schema.enum.join("|")}]` : "";
      return `${p.name}${en}`;
    });
    console.log(`\n${m.toUpperCase()} ${path}`);
    console.log(`  summary: ${def.summary ?? "-"}`);
    console.log(`  params: ${params.length ? params.join(", ") : "(non documentés)"}`);
    const rb = def.requestBody?.content;
    if (rb) {
      const types = Object.keys(rb).join(", ");
      console.log(`  requestBody: ${types}`);
    }
  }
  return true;
}

const paths = [
  "/v1/admin/live-map",
  "/v1/admin/drivers",
  "/v1/admin/safety/sos/{sosId}",
  "/v1/admin/safety/sos",
  "/v1/admin/franchises",
  "/v1/admin/franchises/{id}",
  "/v1/partners/{id}/fleet-pairs",
  "/v1/partners/{id}/drivers/{driverId}/documents",
  "/v1/partners/{id}/vehicles/{vehicleId}/documents",
  "/v1/kyc/documents",
  "/v1/uploads/buckets",
];

console.log("=== Routes cibles (demandes 10 juin) ===");
for (const p of paths) showPath(p);

const full = JSON.stringify(spec);
const terms = [
  "vehicleColorCode",
  "vehicleColor",
  "statusLabel",
  "approval_status",
  "availability_status",
  "riskFactors",
  "partnersCount",
  "documentTypeCode",
  "multipart/form-data",
];
console.log("\n=== Occurrences dans le spec live ===");
for (const t of terms) {
  const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  console.log(`${t}: ${(full.match(re) ?? []).length}`);
}

const schemas = spec.components?.schemas ?? {};
console.log("\n=== Schémas nommés (live-map / driver / sos) ===");
for (const name of Object.keys(schemas).sort()) {
  if (!/live|driver|sos|vehicle|kyc|upload/i.test(name)) continue;
  const props = Object.keys(schemas[name].properties ?? {});
  const blob = JSON.stringify(schemas[name]);
  const flags = [];
  if (/vehicleColor/i.test(blob)) flags.push("vehicleColor");
  if (/statusLabel/i.test(blob)) flags.push("statusLabel");
  if (/approval_status|approvalStatus/i.test(blob)) flags.push("approval");
  if (/availability_status|availabilityStatus/i.test(blob)) flags.push("availability");
  console.log(`- ${name}${flags.length ? ` [${flags.join(", ")}]` : ""}`);
  if (props.length) console.log(`    props: ${props.slice(0, 20).join(", ")}${props.length > 20 ? "…" : ""}`);
}

// --- Probe API live (auth via variables d'environnement) ---
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Client-Type": "back-office",
    },
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const loginRes = await fetch(`${API}/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Client-Type": "back-office" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const loginJson = await loginRes.json();
const token = loginJson.accessToken ?? loginJson.session?.access_token;

if (!token) {
  console.log("\n=== Probe API : login échoué — section ignorée ===");
  process.exit(0);
}

console.log("\n=== Probe API live (réponses réelles) ===");

// LM-VEHICLE-COLOR-01 + LM-STATS-01
const lm = await apiGet("/v1/admin/live-map?includeWithoutLocation=true&limit=5", token);
const d0 = lm.json?.drivers?.[0];
const colorKeys = d0
  ? Object.keys(d0).filter((k) => /color|vehicle/i.test(k))
  : [];
const stats = lm.json?.stats ?? lm.json?.meta?.stats;
console.log("\n[LM-VEHICLE-COLOR-01] live-map");
console.log(`  drivers[0] color keys: ${colorKeys.join(", ") || "AUCUN"}`);
console.log(`  vehicle objet: ${d0?.vehicle ? "oui" : "non"}`);
console.log(`  vehicleColorCode: ${d0?.vehicleColorCode ?? d0?.vehicle_color_code ?? "absent"}`);

console.log("\n[LM-STATS-01] live-map stats");
console.log(`  drivers.length: ${lm.json?.drivers?.length ?? 0}`);
console.log(`  meta.onlineInDatabase: ${lm.json?.meta?.onlineInDatabase ?? "?"}`);
console.log(`  meta.withRecentLocation: ${lm.json?.meta?.withRecentLocation ?? "?"}`);
console.log(`  stats: ${JSON.stringify(stats ?? {})}`);

// Filtres chauffeurs
console.log("\n[DR-FILTERS] GET /v1/admin/drivers");
for (const qs of [
  "page=1&limit=5",
  "page=1&limit=5&account_status=approved",
  "page=1&limit=5&account_status=pending",
  "page=1&limit=5&availability=online",
  "page=1&limit=5&availability=offline",
  "page=1&limit=5&approval_status=pending&account_status=pending",
  "page=1&limit=5&availability_status=online&availability=online",
]) {
  const r = await apiGet(`/v1/admin/drivers?${qs}`, token);
  const items = r.json?.items ?? [];
  const approvals = [...new Set(items.map((i) => i.approval_status))];
  const avail = [...new Set(items.map((i) => i.availability_status))];
  console.log(
    `  ?${qs} → ${items.length} items | approval=[${approvals}] | avail=[${avail}] | total=${r.json?.pagination?.total}`
  );
}

// SOS-DETAIL-01
const sosList = await apiGet("/v1/admin/safety/sos?page=1&limit=3", token);
const sosId = sosList.json?.items?.[0]?.id;
console.log("\n[SOS-DETAIL-01]");
if (!sosId) {
  console.log("  aucun incident SOS en base");
} else {
  const detail = await apiGet(`/v1/admin/safety/sos/${sosId}`, token);
  const inc = detail.json?.incident ?? detail.json;
  const ev0 = (detail.json?.events ?? [])[0];
  console.log(`  incident statusLabel: ${inc?.statusLabel ?? inc?.status_label ?? "absent"}`);
  console.log(`  incident riskFactors[] labels: ${JSON.stringify(inc?.riskFactors ?? inc?.risk_factors ?? []).slice(0, 120)}`);
  console.log(`  event[0] label: ${ev0?.label ?? "absent"} | type: ${ev0?.event_type ?? ev0?.eventType}`);
}

// FR-PARTNERS-COUNT-01
const frList = await apiGet("/v1/admin/franchises?page=1&limit=10", token);
const senegal = (frList.json?.items ?? []).find((f) =>
  /senegal/i.test(f.name ?? "")
);
if (senegal) {
  const detail = await apiGet(`/v1/admin/franchises/${senegal.id}`, token);
  const pcList = senegal.partnersCount ?? senegal.partners_count;
  const pcDetail =
    detail.json?.franchise?.partnersCount ??
    detail.json?.summary?.partnersCount;
  const partnersLen = (detail.json?.partners ?? []).length;
  const ok = pcDetail === partnersLen;
  console.log("\n[FR-PARTNERS-COUNT-01] UPJUNOO SENEGAL");
  console.log(`  liste partnersCount: ${pcList}`);
  console.log(`  détail partnersCount: ${pcDetail} | partners.length: ${partnersLen} → ${ok ? "COHÉRENT" : "INCOHÉRENT"}`);
}

// LM-STATS-01 — snapshot complet (limit 500)
const lmFull = await apiGet(
  "/v1/admin/live-map?includeWithoutLocation=true&limit=500",
  token
);
const ridesInProgress = (lmFull.json?.orders?.rides ?? []).filter(
  (r) => r.status === "in_progress"
).length;
const driverIdsOnTrip = new Set(
  (lmFull.json?.orders?.rides ?? [])
    .filter((r) => r.status === "in_progress" && r.driver_id)
    .map((r) => r.driver_id)
);
console.log("\n[LM-STATS-01] snapshot limit=500");
console.log(`  drivers.length: ${lmFull.json?.drivers?.length ?? 0}`);
console.log(`  meta.withRecentLocation: ${lmFull.json?.meta?.withRecentLocation ?? "?"}`);
console.log(`  stats.online / onTrip / activeTrips: ${lmFull.json?.stats?.online} / ${lmFull.json?.stats?.onTrip} / ${lmFull.json?.stats?.activeTrips}`);
console.log(`  rides in_progress dans payload: ${ridesInProgress}`);
console.log(`  chauffeurs uniques en course: ${driverIdsOnTrip.size}`);

// FLT-VEHICLE-DETAIL-01 — couleur sur détail véhicule
const partners = await apiGet("/v1/admin/partners?page=1&limit=5", token);
const partnerId = partners.json?.items?.[0]?.id;
if (partnerId) {
  const vehicles = await apiGet(
    `/v1/partners/${partnerId}/vehicles?page=1&limit=3`,
    token
  );
  const v0 = vehicles.json?.items?.[0];
  if (v0?.id) {
    const vd = await apiGet(
      `/v1/partners/${partnerId}/vehicles/${v0.id}`,
      token
    );
    const veh = vd.json?.vehicle ?? vd.json;
    console.log("\n[FLT-VEHICLE-DETAIL-01] détail véhicule");
    console.log(`  color_id: ${veh?.color_id ?? veh?.colorId ?? "absent"}`);
    console.log(`  color objet: ${veh?.color ? JSON.stringify(veh.color).slice(0, 120) : "absent"}`);
  }
}

// BINOME-UPLOAD-01 — buckets + fleet-pairs (OPTIONS/GET only)
const buckets = await apiGet("/v1/uploads/buckets", token);
console.log("\n[BINOME-UPLOAD-01]");
console.log(`  GET /v1/uploads/buckets → HTTP ${buckets.status}, keys: ${Object.keys(buckets.json ?? {}).join(", ")}`);
const kycPost = spec.paths["/v1/kyc/documents"]?.post;
const kycMy = spec.paths["/v1/kyc/my-documents"]?.post;
console.log(`  Swagger POST /v1/kyc/documents requestBody: ${kycPost?.requestBody ? "oui" : "non"}`);
console.log(`  Swagger POST /v1/kyc/my-documents: ${kycMy ? "oui" : "non"}`);

// Changelog Swagger
const desc = spec.info?.description ?? "";
const changelog = desc
  .split("\n")
  .filter((l) => /2026-06-10|live-map|viewport|vehicleColor|multipart|fleet-pair/i.test(l))
  .slice(0, 8);
console.log("\n[CHANGELOG Swagger info.description]");
for (const l of changelog) console.log(`  ${l.trim()}`);
