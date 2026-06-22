const API_URL = "https://api.upjunoo-dev.tech";

async function main() {
  const res = await fetch(`${API_URL}/docs/json`);
  if (!res.ok) { console.error("Swagger inaccessible", res.status); process.exit(1); }
  const spec = await res.json();

  // All tags used
  const tags = new Set();
  for (const path of Object.values(spec.paths || {})) {
    for (const method of Object.values(path)) {
      if (method.tags) for (const t of method.tags) tags.add(t);
    }
  }
  console.log("=== Tous les tags Swagger ===");
  for (const t of [...tags].sort()) console.log(`  - ${t}`);

  // Filter support-related endpoints
  const supportPaths = Object.entries(spec.paths || {}).filter(([k]) =>
    k.includes("/support") || k.includes("/notifications") || k.includes("/chat") || k.includes("/dispute") || k.includes("/review")
  );

  console.log("\n=== SECTION 10 - Support (endpoints liés) ===\n");
  for (const [path, methods] of supportPaths) {
    for (const [method, def] of Object.entries(methods)) {
      console.log(`${method.toUpperCase().padEnd(6)} ${path.padEnd(50)}  ${def.summary || def.description || ""}`);
    }
  }
}

main().catch(console.error);
