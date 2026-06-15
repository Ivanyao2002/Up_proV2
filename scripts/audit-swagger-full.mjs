const API_URL = "https://api.upjunoo-dev.tech";

async function main() {
  const res = await fetch(`${API_URL}/docs/json`);
  if (!res.ok) { console.error("Swagger inaccessible", res.status); process.exit(1); }
  const spec = await res.json();

  // ─── SECTION 10 - Support endpoints ───
  console.log("=== SECTION 10 - Support : Endpoints détaillés ===\n");

  const supportPaths = Object.entries(spec.paths || {}).filter(([k]) =>
    k.includes("/support") || k.includes("/notifications") || k.includes("/chat/conversations") || k.includes("/dispute")
  );

  for (const [path, methods] of supportPaths) {
    for (const [method, def] of Object.entries(methods)) {
      if (!def || typeof def !== "object") continue;
      console.log(`${method.toUpperCase().padEnd(6)} ${path}`);
      console.log(`       Tags: ${(def.tags || []).join(", ")}`);
      console.log(`       Summary: ${def.summary || def.description || "N/A"}`);
      console.log("");
    }
  }

  // ─── Notifications push-config detail ───
  console.log("\n=== Notifications push-config schema ===");
  const pushConfig = spec.paths?.["/v1/notifications/push-config"]?.["get"];
  if (pushConfig) {
    console.log("GET /v1/notifications/push-config");
    console.log("Parameters:", JSON.stringify(pushConfig.parameters || [], null, 2));
    console.log("Responses:", JSON.stringify(pushConfig.responses || {}, null, 2));
  }

  // POST /v1/notifications/push/test
  console.log("\n=== Notifications push/test schema ===");
  const pushTest = spec.paths?.["/v1/notifications/push/test"]?.["post"];
  if (pushTest) {
    console.log("POST /v1/notifications/push/test");
    console.log("RequestBody:", JSON.stringify(pushTest.requestBody || {}, null, 2));
    console.log("Responses:", JSON.stringify(pushTest.responses || {}, null, 2));
  }

  // POST /v1/notifications/test
  console.log("\n=== Notifications test schema ===");
  const notifTest = spec.paths?.["/v1/notifications/test"]?.["post"];
  if (notifTest) {
    console.log("POST /v1/notifications/test");
    console.log("RequestBody:", JSON.stringify(notifTest.requestBody || {}, null, 2));
    console.log("Responses:", JSON.stringify(notifTest.responses || {}, null, 2));
  }

  // Chat conversations
  console.log("\n=== Chat conversations schema ===");
  const chatConv = spec.paths?.["/v1/chat/conversations"]?.["get"];
  if (chatConv) {
    console.log("GET /v1/chat/conversations");
    console.log("Parameters:", JSON.stringify(chatConv.parameters || [], null, 2));
    console.log("Responses:", JSON.stringify(chatConv.responses || {}, null, 2));
  }

  const chatMsgs = spec.paths?.["/v1/chat/conversations/{id}/messages"]?.["get"];
  if (chatMsgs) {
    console.log("GET /v1/chat/conversations/{id}/messages");
    console.log("Parameters:", JSON.stringify(chatMsgs.parameters || [], null, 2));
    console.log("Responses:", JSON.stringify(chatMsgs.responses || {}, null, 2));
  }

  // Support tickets
  console.log("\n=== Support tickets (global) schema ===");
  const tickets = spec.paths?.["/v1/support/tickets"]?.["get"];
  if (tickets) {
    console.log("GET /v1/support/tickets");
    console.log("Parameters:", JSON.stringify(tickets.parameters || [], null, 2));
  }
}

main().catch(console.error);
