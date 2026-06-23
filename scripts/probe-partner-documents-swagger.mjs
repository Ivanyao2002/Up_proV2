/**
 * Swagger live — routes documents partenaire (upload / replace / delete)
 * Usage: node scripts/probe-partner-documents-swagger.mjs
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";

const spec = await (await fetch(`${API}/docs/json`)).json();
console.log(`OpenAPI v${spec.info?.version} — ${Object.keys(spec.paths).length} paths\n`);

const TARGET_PATHS = [
  "/v1/partners/{id}/documents",
  "/v1/partners/{id}/documents/{documentId}",
  "/v1/partners/{id}/drivers/{driverId}/documents",
  "/v1/partners/{id}/drivers/{driverId}/documents/{documentId}",
  "/v1/partners/{id}/vehicles/{vehicleId}/documents",
  "/v1/partners/{id}/vehicles/{vehicleId}/documents/{documentId}",
  "/v1/kyc/documents",
  "/v1/kyc/documents/{documentId}",
  "/v1/kyc/my-documents",
  "/v1/kyc/my-documents/{documentId}",
  "/v1/admin/kyc/documents",
  "/v1/admin/kyc/documents/{documentId}",
  "/v1/admin/kyc/documents/{documentId}/approve",
  "/v1/admin/kyc/documents/{documentId}/reject",
  "/v1/uploads/signed-url",
  "/v1/uploads/{uploadId}",
  "/v1/files/{fileId}",
];

function jsonBodyProps(def) {
  const schema = def.requestBody?.content?.["application/json"]?.schema;
  if (!schema) return null;
  if (schema.properties) return Object.keys(schema.properties);
  if (schema.$ref) return [`$ref:${schema.$ref.split("/").pop()}`];
  if (schema.allOf) return schema.allOf.map((s) => s.$ref?.split("/").pop()).filter(Boolean);
  return null;
}

function describeOp(method, path, def) {
  const props = jsonBodyProps(def);
  const params = (def.parameters ?? []).map((p) => `${p.in}:${p.name}`).join(", ");
  console.log(`  ${method.toUpperCase()} ${path}`);
  console.log(`    summary: ${def.summary ?? "—"}`);
  if (def.description) {
    const short = def.description.replace(/\s+/g, " ").slice(0, 200);
    console.log(`    desc: ${short}${def.description.length > 200 ? "…" : ""}`);
  }
  if (params) console.log(`    params: ${params}`);
  if (props?.length) console.log(`    body: ${props.join(", ")}`);
  const tags = def.tags?.join(", ");
  if (tags) console.log(`    tags: ${tags}`);
  console.log("");
}

console.log("=== Routes cibles (présence dans Swagger) ===\n");
for (const path of TARGET_PATHS) {
  const item = spec.paths[path];
  if (!item) {
    console.log(`❌ ABSENT: ${path}\n`);
    continue;
  }
  console.log(`✅ ${path}`);
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    if (item[method]) describeOp(method, path, item[method]);
  }
}

console.log("=== Autres routes *documents* (partners / kyc / uploads) ===\n");
for (const path of Object.keys(spec.paths).sort()) {
  if (!path.includes("document") && !path.includes("upload")) continue;
  if (TARGET_PATHS.includes(path)) continue;
  if (!path.includes("partner") && !path.includes("kyc") && !path.includes("upload")) continue;
  const item = spec.paths[path];
  const methods = Object.keys(item).filter((m) =>
    ["get", "post", "put", "patch", "delete"].includes(m)
  );
  if (!methods.length) continue;
  console.log(`${path} → ${methods.join(", ").toUpperCase()}`);
  for (const method of methods) {
    const def = item[method];
    console.log(`    ${method.toUpperCase()}: ${def.summary ?? "—"}`);
  }
  console.log("");
}

// Schemas liés au remplacement
console.log("=== Schémas / champs replace|supersed|replaces dans components ===\n");
const schemas = spec.components?.schemas ?? {};
for (const [name, schema] of Object.entries(schemas)) {
  const raw = JSON.stringify(schema).toLowerCase();
  if (
    !name.toLowerCase().includes("document") &&
    !name.toLowerCase().includes("upload") &&
    !name.toLowerCase().includes("kyc")
  ) {
    continue;
  }
  if (
    raw.includes("replace") ||
    raw.includes("supersed") ||
    raw.includes("replacesdocument")
  ) {
    console.log(`Schema: ${name}`);
    console.log(JSON.stringify(schema, null, 2).slice(0, 800));
    console.log("");
  }
}
