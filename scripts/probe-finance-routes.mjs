/**
 * Probe routes finance admin — compare front vs Swagger live + HTTP status.
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const spec = await (await fetch(`${API}/docs/json`)).json();
const livePaths = new Set(Object.keys(spec.paths));

const ROUTES = [
  { method: "GET", path: "/v1/admin/settings/finance-caps", front: true },
  { method: "PUT", path: "/v1/admin/settings/finance-caps", front: true },
  { method: "GET", path: "/v1/admin/finance/ledger", front: true, note: "front utilise ce chemin" },
  { method: "GET", path: "/v1/admin/ledger", front: false, note: "Swagger a ce chemin à la place" },
  { method: "GET", path: "/v1/admin/ledger/export", front: false },
  { method: "GET", path: "/v1/admin/bonus-rules", front: true },
  { method: "GET", path: "/v1/admin/bonus-awards", front: true },
  { method: "GET", path: "/v1/admin/finance/wallets", front: true },
  { method: "GET", path: "/v1/admin/finance/transactions", front: true },
  { method: "GET", path: "/v1/drivers/00000000-0000-0000-0000-000000000001/wallet", front: true },
  { method: "GET", path: "/v1/drivers/00000000-0000-0000-0000-000000000001/ledger", front: true },
  { method: "GET", path: "/v1/partners/00000000-0000-0000-0000-000000000001/wallet", front: true },
  { method: "GET", path: "/v1/partners/00000000-0000-0000-0000-000000000001/ledger", front: true },
  { method: "GET", path: "/v1/admin/franchises/00000000-0000-0000-0000-000000000001/wallet", front: true },
  { method: "GET", path: "/v1/franchises/00000000-0000-0000-0000-000000000001/wallet", front: true },
  { method: "GET", path: "/v1/admin/orders/00000000-0000-0000-0000-000000000001", front: true },
];

function inSwagger(method, path) {
  const base = path.replace(/\/[0-9a-f-]{36}/g, "/{id}").replace(/\/\{id\}/g, (m, off, s) => {
    // keep as generic
    return "/{id}";
  });
  for (const p of livePaths) {
    const norm = p.replace(/\{[^}]+\}/g, "{id}");
    const probeNorm = path
      .split("?")[0]
      .replace(/\/[0-9a-f-]{36}/gi, "/{id}");
    if (norm === probeNorm && spec.paths[p]?.[method.toLowerCase()]) return p;
  }
  return null;
}

const loginRes = await fetch(`${API}/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Client-Type": "back-office" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const loginJson = await loginRes.json();
const token = loginJson.accessToken ?? loginJson.session?.access_token;

const headers = token
  ? { Authorization: `Bearer ${token}`, Accept: "application/json", "X-Client-Type": "back-office" }
  : { Accept: "application/json" };

console.log("API:", API, "| Swagger v", spec.info?.version);
console.log("Auth:", token ? "OK" : "FAILED");
console.log("\n| Swagger | HTTP | Route | Note |");
console.log("|--------|------|-------|------|");

for (const r of ROUTES) {
  const swaggerPath = inSwagger(r.method, r.path);
  const url = `${API}${r.path.split("?")[0]}${r.path.includes("?") ? "?" + r.path.split("?")[1] : ""}`;
  let status = "—";
  let bodyHint = "";
  if (token || r.method === "GET") {
    try {
      const res = await fetch(url, { method: r.method, headers, body: r.method === "PUT" ? JSON.stringify({}) : undefined });
      status = String(res.status);
      try {
        const j = await res.json();
        bodyHint = j?.error?.code ?? j?.message?.slice?.(0, 40) ?? "";
        if (res.ok && j?.wallet) {
          bodyHint = "wallet keys: " + Object.keys(j.wallet).join(",");
        }
        if (res.ok && j?.items?.[0]) {
          bodyHint = "item keys: " + Object.keys(j.items[0]).join(",");
        }
      } catch {
        /* */
      }
    } catch (e) {
      status = "ERR";
    }
  }
  console.log(
    `| ${swaggerPath ? "✅" : "❌"} | ${status} | ${r.method} ${r.path} | ${r.note ?? bodyHint} |`
  );
}

// Sample wallet fields from real wallet if we can find a driver
if (token) {
  const driversRes = await fetch(`${API}/v1/admin/drivers?page=1&limit=1`, { headers });
  if (driversRes.ok) {
    const d = await driversRes.json();
    const driverId = d?.items?.[0]?.id ?? d?.data?.[0]?.id;
    if (driverId) {
      const wRes = await fetch(`${API}/v1/drivers/${driverId}/wallet`, { headers });
      if (wRes.ok) {
        const w = await wRes.json();
        console.log("\n=== Exemple réponse GET /v1/drivers/{id}/wallet ===");
        console.log(JSON.stringify(w, null, 2).slice(0, 1200));
      }
    }
  }
  const walletsRes = await fetch(`${API}/v1/admin/finance/wallets?page=1&limit=1`, { headers });
  if (walletsRes.ok) {
    const w = await walletsRes.json();
    console.log("\n=== Exemple GET /v1/admin/finance/wallets ===");
    console.log(JSON.stringify(w, null, 2).slice(0, 1200));
  }
}
