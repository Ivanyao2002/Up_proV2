const API = "https://api.upjunoo-dev.tech";

const rF = await fetch(API + "/v1/auth/franchise/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Client-Type": "back-office" },
  body: JSON.stringify({ email: "dev.franchise.bf@upjunoo-dev.tech", password: "Upjunoo@Dev2026!" }),
});
const franchiseToken = (await rF.json()).accessToken;
const hF = { Authorization: "Bearer " + franchiseToken, Accept: "application/json", "X-Client-Type": "back-office" };

const rA = await fetch(API + "/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Client-Type": "back-office" },
  body: JSON.stringify({ email: "dev.admin@upjunoo-dev.tech", password: "Upjunoo@Dev2026!" }),
});
const adminToken = (await rA.json()).accessToken;
const hA = { Authorization: "Bearer " + adminToken, Accept: "application/json", "X-Client-Type": "back-office" };

const FID = "82781966-5ca5-4a67-9147-1a6dd245e31d";

const tests = [
  // MANQUE-005 — extension-request (nouvelle route dans Swagger live)
  ["GET",  "/v1/franchise/territory/extension-request",                     hF, "MANQUE-005 territory/extension-request GET"],
  ["POST", "/v1/franchise/territory/extension-request",                     hF, "MANQUE-005 territory/extension-request POST"],
  // MANQUE-006/007 — détails finance (données en base ?)
  ["GET",  "/v1/franchise/finance/commissions?page=1&limit=5",              hF, "MANQUE-006 commissions list"],
  ["GET",  "/v1/franchise/finance/reconciliation?page=1&limit=5",           hF, "MANQUE-007 reconciliation list"],
  // MANQUE-009 — promos
  ["GET",  "/v1/franchise/promos?page=1&limit=5",                           hF, "MANQUE-009 promos list"],
  ["GET",  "/v1/franchise/promos/00000000-0000-0000-0000-000000000001",     hF, "MANQUE-009 promo by id (fake)"],
  // MANQUE-010 — support tickets
  ["GET",  "/v1/franchise/support/tickets?page=1&limit=5",                  hF, "MANQUE-010 tickets list"],
  ["GET",  "/v1/franchise/support/tickets/00000000-0000-0000-0000-000000000001", hF, "MANQUE-010 ticket by id (fake)"],
  // Chat detail
  ["GET",  "/v1/franchise/support/chat?page=1&limit=5",                     hF, "chat list"],
  ["GET",  "/v1/franchise/support/chat/00000000-0000-0000-0000-000000000001",    hF, "chat by id (fake)"],
  // BUG-002 — login response
  ["POST", "/v1/auth/franchise/login",                                      null, "BUG-002 login fields check"],
];

for (const [method, path, headers, label] of tests) {
  let res, data;
  if (headers) {
    const opts = { method, headers };
    if (method === "POST") opts.body = JSON.stringify({});
    res = await fetch(API + path, opts);
  } else {
    // login probe
    res = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-Type": "back-office" },
      body: JSON.stringify({ email: "dev.franchise.bf@upjunoo-dev.tech", password: "Upjunoo@Dev2026!" }),
    });
  }
  data = await res.json().catch(() => ({}));
  const keys = Object.keys(data).join(", ");
  const preview = JSON.stringify(data).slice(0, 200);
  console.log(`[${res.status}] ${label}`);
  console.log(`  keys: ${keys}`);
  console.log(`  ${preview}`);
  console.log("");
}
