/**
 * Probe franchise settings endpoints from BACKEND_BUGS_FRANCHISE.md
 */
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";

const ENDPOINTS = [
  // Settings - Météo & Général
  { method: "GET", path: "/v1/franchise/settings/weather-config", label: "Weather Config" },
  { method: "PUT", path: "/v1/franchise/settings/weather-config", label: "Update Weather" },
  { method: "POST", path: "/v1/franchise/settings/weather/refresh", label: "Refresh Weather" },
  { method: "GET", path: "/v1/franchise/settings/general", label: "General Settings" },
  { method: "PUT", path: "/v1/franchise/settings/general", label: "Update General" },
  
  // Vehicles (Fleet)
  { method: "GET", path: "/v1/franchise/fleet/vehicles", label: "List Vehicles" },
  { method: "GET", path: "/v1/franchise/fleet/vehicles/00000000-0000-0000-0000-000000000001", label: "Get Vehicle" },
  { method: "POST", path: "/v1/franchise/fleet/vehicles/00000000-0000-0000-0000-000000000001/approve", label: "Approve Vehicle" },
  { method: "POST", path: "/v1/franchise/fleet/vehicles/00000000-0000-0000-0000-000000000001/reject", label: "Reject Vehicle" },
  
  // KYC / Drivers Moderation
  { method: "GET", path: "/v1/franchise/drivers/moderation", label: "KYC Queue" },
];

async function login() {
  const res = await fetch(`${API}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Type": "back-office",
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const j = await res.json();
  return j.accessToken ?? j.session?.access_token;
}

async function probe(method, path, token) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: method !== "GET" ? JSON.stringify({}) : undefined,
  });
  
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 100) }; }
  
  const code = json?.error?.code ?? json?.code ?? "";
  return { status: res.status, ok: res.ok, code };
}

async function main() {
  console.log("\n=== PROBE FRANCHISE ENDPOINTS ===\n");
  console.log(`API: ${API}`);
  console.log(`Email: ${EMAIL}\n`);
  
  const token = await login();
  if (!token) {
    console.error("❌ Login failed");
    process.exit(1);
  }
  console.log("✅ Login OK\n");
  
  const results = { ok: [], missing: [], error: [] };
  
  for (const ep of ENDPOINTS) {
    const r = await probe(ep.method, ep.path, token);
    const icon = r.ok ? "✅" : r.status === 404 ? "❌" : "⚠️";
    const status = r.ok ? "OK" : r.status === 404 ? "NOT_FOUND" : `HTTP_${r.status}`;
    
    console.log(`${icon} [${ep.method}] ${ep.path}`);
    console.log(`   Label: ${ep.label}`);
    console.log(`   Status: ${status}${r.code ? ` (${r.code})` : ""}\n`);
    
    if (r.ok) results.ok.push(ep);
    else if (r.status === 404) results.missing.push(ep);
    else results.error.push({ ...ep, status: r.status, code: r.code });
  }
  
  console.log("\n=== SUMMARY ===");
  console.log(`✅ OK: ${results.ok.length}`);
  console.log(`❌ NOT_FOUND (backend manque): ${results.missing.length}`);
  console.log(`⚠️ ERRORS: ${results.error.length}\n`);
  
  if (results.missing.length > 0) {
    console.log("Endpoints manquants côté backend:");
    for (const ep of results.missing) {
      console.log(`  - ${ep.method} ${ep.path} (${ep.label})`);
    }
  }
}

main().catch(console.error);
