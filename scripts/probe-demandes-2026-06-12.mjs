/**
 * Vérifie DEMANDES-2026-06-12.md vs Swagger live + API.
 * Usage: node scripts/probe-demandes-2026-06-12.mjs
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, json };
}

function verdict(ok, partial) {
  if (ok) return "✅ FAIT";
  if (partial) return "⚠️ PARTIEL";
  return "❌ NON FAIT";
}

const spec = await (await fetch(`${API}/docs/json`)).json();
const path = "/v1/admin/kyc/queue";
const getOp = spec.paths[path]?.get;
const params = (getOp?.parameters ?? []).map((p) => p.name);
const paramSet = new Set(params);

console.log(`\n=== DEMANDES-2026-06-12 — ${API} ===`);
console.log(`OpenAPI v${spec.info?.version ?? "?"} — ${Object.keys(spec.paths).length} paths\n`);

console.log("--- Swagger GET /v1/admin/kyc/queue ---");
console.log("summary:", getOp?.summary ?? "(route absente)");
console.log("params documentés:", params.length ? params.join(", ") : "(aucun)");

const login = await request("/v1/auth/login", {
  method: "POST",
  body: { email: EMAIL, password: PASSWORD },
});
const token = login.json?.accessToken ?? login.json?.session?.access_token;
if (!token) {
  console.error("Login échoué", login.status, login.json);
  process.exit(1);
}

async function queue(qs) {
  const r = await request(`${path}?${qs}`, { token });
  const items = r.json?.items ?? [];
  return {
    status: r.status,
    total: r.json?.pagination?.total,
    count: items.length,
    names: items.map((i) => i.displayName),
    submittedAt: items[0]?.submittedAt ?? null,
  };
}

const base = await queue("page=1&limit=25");
const searchFull = await queue(`page=1&limit=25&search=${encodeURIComponent("ndja fabrice")}`);
const searchNdja = await queue("page=1&limit=25&search=ndja");
const dateToday = await queue("page=1&limit=25&dateFrom=2026-06-12&dateTo=2026-06-12");
const dateFuture = await queue("page=1&limit=25&dateFrom=2099-01-01&dateTo=2099-01-01");

console.log("\n--- Probe API ---");
console.log("sans filtre     :", JSON.stringify(base));
console.log("search ndja fab :", JSON.stringify(searchFull));
console.log("search ndja     :", JSON.stringify(searchNdja));
console.log("date 2026-06-12 :", JSON.stringify(dateToday));
console.log("date 2099       :", JSON.stringify(dateFuture));

const searchWorks =
  searchFull.total === 1 &&
  searchFull.count === 1 &&
  searchFull.names.some((n) => /fabrice/i.test(n) && /ndja|n'dja/i.test(n));
const searchPartial =
  !searchWorks && searchFull.total < base.total && searchFull.count > 0;
const dateWorks =
  dateToday.total < base.total &&
  dateFuture.total === 0 &&
  dateToday.count > 0;
const datePartial = !dateWorks && dateToday.total !== base.total;
const isoSubmitted =
  base.submittedAt != null && /^\d{4}-\d{2}-\d{2}T/.test(String(base.submittedAt));

console.log("\n--- Verdict DEMANDES-2026-06-12 ---");
console.log(
  `KYC-QUEUE-SEARCH-01 filtre search     : ${verdict(searchWorks, searchPartial)} (total ${searchFull.total}/${base.total})`
);
console.log(
  `KYC-QUEUE-SEARCH-01 Swagger search    : ${paramSet.has("search") ? "✅ documenté" : "❌ non documenté"}`
);
console.log(
  `KYC-QUEUE-SEARCH-01 submittedAt ISO   : ${isoSubmitted ? "✅ FAIT" : `❌ NON FAIT (${base.submittedAt})`}`
);
console.log(
  `KYC-QUEUE-DATE-01 filtre date         : ${verdict(dateWorks, datePartial)} (today ${dateToday.total}/${base.total}, future ${dateFuture.total})`
);
console.log(
  `KYC-QUEUE-DATE-01 Swagger dateFrom/To : ${
    paramSet.has("dateFrom") && paramSet.has("dateTo")
      ? "✅ documenté"
      : "❌ non documenté"
  }`
);
console.log(
  `Swagger page/limit                    : ${
    paramSet.has("page") && paramSet.has("limit") ? "✅ documenté" : "❌ non documenté"
  }`
);
