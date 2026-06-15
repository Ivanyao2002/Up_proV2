/**
 * Vérifie Swagger live — upload images/documents création chauffeur.
 * Usage: node scripts/probe-driver-upload-swagger.mjs
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";

const spec = await (await fetch(`${API}/docs/json`)).json();
console.log(`OpenAPI v${spec.info?.version} — ${Object.keys(spec.paths).length} paths\n`);

const TARGET_PATHS = [
  "/v1/partners/{id}/drivers",
  "/v1/partners/{id}/drivers/{driverId}/documents",
  "/v1/kyc/documents",
  "/v1/kyc/my-documents",
  "/v1/uploads/signed-url",
  "/v1/uploads/buckets",
  "/v1/drivers/{id}/documents",
  "/v1/admin/kyc/documents",
  "/v1/partners/{id}/vehicles/{vehicleId}/documents",
];

function describeRequestBody(def) {
  const content = def.requestBody?.content ?? {};
  const types = Object.keys(content);
  if (!types.length) return { types: [], detail: "aucun body" };

  const out = { types, detail: "" };
  if (content["multipart/form-data"]) {
    const schema = content["multipart/form-data"].schema ?? {};
    const props = schema.properties
      ? Object.keys(schema.properties)
      : schema.required ?? [];
    out.detail = `multipart fields: ${props.join(", ") || JSON.stringify(schema).slice(0, 200)}`;
  }
  if (content["application/json"]) {
    const schema = content["application/json"].schema ?? {};
    const ref = schema.$ref ?? "";
    const props = schema.properties ? Object.keys(schema.properties) : [];
    out.detail += (out.detail ? " | " : "") + `json: ${ref || props.join(", ")}`;
  }
  return out;
}

console.log("=== Routes cibles création chauffeur / KYC ===\n");
for (const path of TARGET_PATHS) {
  const item = spec.paths[path];
  if (!item) {
    console.log(`❌ ABSENT: ${path}\n`);
    continue;
  }
  for (const [method, def] of Object.entries(item)) {
    if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
    const rb = describeRequestBody(def);
    const hasMultipart = rb.types.includes("multipart/form-data");
    const icon = hasMultipart ? "✅" : method === "post" ? "⚠️" : "·";
    console.log(`${icon} ${method.toUpperCase()} ${path}`);
    console.log(`   summary: ${def.summary ?? "-"}`);
    console.log(`   body: ${rb.types.join(", ") || "—"} — ${rb.detail}`);
    const params = (def.parameters ?? []).map((p) => p.name);
    if (params.length) console.log(`   params: ${params.join(", ")}`);
    console.log("");
  }
}

const multipartRoutes = [];
for (const [path, ops] of Object.entries(spec.paths)) {
  for (const [method, def] of Object.entries(ops)) {
    if (def.requestBody?.content?.["multipart/form-data"]) {
      multipartRoutes.push(`${method.toUpperCase()} ${path}`);
    }
  }
}

console.log(`=== Routes multipart/form-data dans tout le Swagger (${multipartRoutes.length}) ===`);
for (const route of multipartRoutes) console.log(`  ${route}`);

const desc = spec.info?.description ?? "";
const uploadHints = desc
  .split("\n")
  .filter((l) => /upload|kyc|signed-url|multipart|my-documents|document-type/i.test(l))
  .slice(0, 12);
console.log("\n=== Extrait changelog Swagger (upload/KYC) ===");
for (const line of uploadHints) console.log(`  ${line.trim()}`);

// Probe OPTIONS/GET buckets (public metadata)
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";
const login = await (
  await fetch(`${API}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
).json();
const token = login.accessToken ?? login.session?.access_token;

if (token) {
  const h = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "X-Client-Type": "back-office",
  };
  const buckets = await (await fetch(`${API}/v1/uploads/buckets`, { headers: h })).json();
  console.log("\n=== Probe GET /v1/uploads/buckets ===");
  console.log(JSON.stringify(buckets, null, 2).slice(0, 600));

  // Test if partner driver documents route exists (404 vs 405)
  const partners = await (
    await fetch(`${API}/v1/admin/partners?page=1&limit=1`, { headers: h })
  ).json();
  const partnerId = partners.items?.[0]?.id;
  if (partnerId) {
    const probeUrl = `${API}/v1/partners/${partnerId}/drivers/00000000-0000-0000-0000-000000000001/documents`;
    const probe = await fetch(probeUrl, {
      method: "POST",
      headers: { ...h, "Content-Type": "application/json" },
      body: JSON.stringify({ documentTypeCode: "CNI", uploadId: "test" }),
    });
    const probeJson = await probe.json().catch(() => null);
    console.log("\n=== Probe POST partner driver documents (dummy id) ===");
    console.log(`HTTP ${probe.status}`, JSON.stringify(probeJson).slice(0, 300));
  }
}

console.log("\n=== VERDICT FRONT ===");
console.log(
  "createDriverWithDocumentsViaV1 : crée le chauffeur mais N'ENVOIE PAS les fichiers (stub dans partnerDrivers.v1.service.ts)"
);
console.log(
  "uploadDocument v1 : POST JSON {type, filename} sur /v1/drivers/{id}/documents — pas de binaire"
);
