/**
 * Scan complet des demandes backend — v9 (2026-06-20)
 * Vérifie si les P1/P2 du rapport ont été fixés côté API live.
 * Usage: node scripts/scan-demandes-v9.mjs
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";
const PARTNER_ID = process.env.TEST_PARTNER_ID ?? "71a1aad7-ad23-41ca-a6d0-b904d5953271";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Client-Type": "back-office",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 500) }; }
  return { status: res.status, ok: res.ok, json };
}

const results = [];

function log(id, label, status, detail, sample) {
  const icon = status === "ok" ? "✅" : status === "partial" ? "⚠️" : status === "fix" ? "🔧" : "❌";
  console.log(`${icon} [${id}] ${label}`);
  console.log(`    ${detail}`);
  if (sample) console.log(`    → ${JSON.stringify(sample).slice(0, 300)}`);
  results.push({ id, label, status, detail, sample });
}

async function main() {
  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`  SCAN DEMANDES BACKEND v9 — ${API_URL}`);
  console.log(`  Partner: ${PARTNER_ID}`);
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  // Login
  const login = await request("/v1/auth/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  const token = login.json?.accessToken ?? login.json?.session?.access_token ?? null;
  if (!token) {
    console.error("❌ Login failed", login.status, JSON.stringify(login.json).slice(0, 200));
    process.exit(1);
  }
  console.log("✅ Connecté\n");

  // ─── P1 #6: GET /vehicles?status=rejected ───
  console.log("─── P1 #6: Filtre status véhicules ───");
  {
    const all = await request(`/v1/partners/${PARTNER_ID}/vehicles`, { token });
    const filtered = await request(`/v1/partners/${PARTNER_ID}/vehicles?status=rejected`, { token });
    const allItems = all.json?.items ?? all.json?.data ?? [];
    const filteredItems = filtered.json?.items ?? filtered.json?.data ?? [];
    const allStatuses = allItems.map(v => v.approval_status ?? v.status);
    const filteredStatuses = filteredItems.map(v => v.approval_status ?? v.status);
    const hasOnlyRejected = filteredStatuses.length > 0 && filteredStatuses.every(s => s === "rejected");
    const sameCount = allItems.length === filteredItems.length;

    if (hasOnlyRejected) {
      log("P1-6", "GET /vehicles?status=rejected", "fix", `Filtre OK — ${filteredItems.length} véhicules rejetés retournés`, filteredStatuses);
    } else if (sameCount && allItems.length > 0) {
      log("P1-6", "GET /vehicles?status=rejected", "fail", `Filtre IGNORE — ${filteredItems.length} véhicules (même count que sans filtre=${allItems.length}), statuts: ${JSON.stringify(filteredStatuses.slice(0, 5))}`, { all: allStatuses.slice(0, 5), filtered: filteredStatuses.slice(0, 5) });
    } else {
      log("P1-6", "GET /vehicles?status=rejected", "partial", `Résultat incertain — all=${allItems.length}, filtered=${filteredItems.length}`, filteredStatuses.slice(0, 5));
    }
  }

  // ─── P1 #7: PATCH /drivers/{driverId} ───
  console.log("\n─── P1 #7: PATCH /drivers/{driverId} ───");
  {
    // Get a driver ID first
    const driversRes = await request(`/v1/partners/${PARTNER_ID}/drivers`, { token });
    const drivers = driversRes.json?.items ?? driversRes.json?.data ?? [];
    const driverId = drivers[0]?.id ?? drivers[0]?.driver_id;
    if (driverId) {
      const patchRes = await request(`/v1/partners/${PARTNER_ID}/drivers/${driverId}`, {
        method: "PATCH",
        token,
        body: { availability_status: "offline" },
      });
      if (patchRes.status === 200 || patchRes.status === 204) {
        log("P1-7", "PATCH /drivers/{driverId}", "fix", `Route existe — HTTP ${patchRes.status}`, patchRes.json);
      } else if (patchRes.status === 404) {
        log("P1-7", "PATCH /drivers/{driverId}", "fail", `Route inexistante — HTTP 404`, patchRes.json);
      } else {
        log("P1-7", "PATCH /drivers/{driverId}", "partial", `HTTP ${patchRes.status}`, patchRes.json);
      }
    } else {
      log("P1-7", "PATCH /drivers/{driverId}", "fail", "Aucun chauffeur trouvé pour tester");
    }
  }

  // ─── P1 #8: GET /vehicles?dateFrom=&dateTo= ───
  console.log("\n─── P1 #8: Filtre date véhicules ───");
  {
    const all = await request(`/v1/partners/${PARTNER_ID}/vehicles`, { token });
    const filtered = await request(`/v1/partners/${PARTNER_ID}/vehicles?dateFrom=2026-01-01&dateTo=2026-01-02`, { token });
    const allItems = all.json?.items ?? all.json?.data ?? [];
    const filteredItems = filtered.json?.items ?? filtered.json?.data ?? [];
    const sameCount = allItems.length === filteredItems.length;

    if (filteredItems.length < allItems.length) {
      log("P1-8", "GET /vehicles?dateFrom=&dateTo=", "fix", `Filtre OK — ${filteredItems.length} vs ${allItems.length} sans filtre`, { filtered: filteredItems.length, all: allItems.length });
    } else if (sameCount && allItems.length > 0) {
      log("P1-8", "GET /vehicles?dateFrom=&dateTo=", "fail", `Filtre IGNORE — ${filteredItems.length} véhicules (même count que sans filtre=${allItems.length})`, { all: allItems.length, filtered: filteredItems.length });
    } else {
      log("P1-8", "GET /vehicles?dateFrom=&dateTo=", "partial", `Résultat incertain — all=${allItems.length}, filtered=${filteredItems.length}`);
    }
  }

  // ─── P1 #9: GET /drivers?account_status=&availability= ───
  console.log("\n─── P1 #9: Filtres drivers ───");
  {
    const all = await request(`/v1/partners/${PARTNER_ID}/drivers`, { token });
    const byStatus = await request(`/v1/partners/${PARTNER_ID}/drivers?account_status=suspended`, { token });
    const byAvail = await request(`/v1/partners/${PARTNER_ID}/drivers?availability=online`, { token });
    const allItems = all.json?.items ?? all.json?.data ?? [];
    const statusItems = byStatus.json?.items ?? byStatus.json?.data ?? [];
    const availItems = byAvail.json?.items ?? byAvail.json?.data ?? [];
    const statusAllSuspended = statusItems.length > 0 && statusItems.every(d => (d.account_status ?? d.user?.account_status) === "suspended");
    const availAllOnline = availItems.length > 0 && availItems.every(d => (d.availability_status ?? d.user?.availability_status) === "online");

    if (statusAllSuspended && availAllOnline) {
      log("P1-9", "GET /drivers?account_status=&availability=", "fix", "Les deux filtres fonctionnent", { status: statusItems.length, avail: availItems.length });
    } else if (allItems.length === statusItems.length && allItems.length === availItems.length && allItems.length > 0) {
      log("P1-9", "GET /drivers?account_status=&availability=", "fail", `Filtres IGNORES — all=${allItems.length}, suspended=${statusItems.length}, online=${availItems.length} (même count)`, { all: allItems.length, suspended: statusItems.length, online: availItems.length });
    } else {
      log("P1-9", "GET /drivers?account_status=&availability=", "partial", `Résultat incertain — all=${allItems.length}, suspended=${statusItems.length}, online=${availItems.length}`, {
        statusSample: statusItems.slice(0, 2).map(d => ({ account_status: d.account_status, availability: d.availability_status })),
        availSample: availItems.slice(0, 2).map(d => ({ account_status: d.account_status, availability: d.availability_status })),
      });
    }
  }

  // ─── P1 #10: GET /drivers?search= ───
  console.log("\n─── P1 #10: Recherche drivers ───");
  {
    const all = await request(`/v1/partners/${PARTNER_ID}/drivers`, { token });
    const searched = await request(`/v1/partners/${PARTNER_ID}/drivers?search=zzzznotexist`, { token });
    const allItems = all.json?.items ?? all.json?.data ?? [];
    const searchItems = searched.json?.items ?? searched.json?.data ?? [];

    if (searchItems.length === 0 && allItems.length > 0) {
      log("P1-10", "GET /drivers?search=", "fix", `Recherche OK — search "zzzznotexist" retourne 0 résultats (vs ${allItems.length} sans filtre)`, { all: allItems.length, search: searchItems.length });
    } else if (searchItems.length === allItems.length && allItems.length > 0) {
      log("P1-10", "GET /drivers?search=", "fail", `Recherche IGNORE — search "zzzznotexist" retourne ${searchItems.length} résultats (même count que sans filtre=${allItems.length})`, { all: allItems.length, search: searchItems.length });
    } else {
      log("P1-10", "GET /drivers?search=", "partial", `Résultat incertain — all=${allItems.length}, search=${searchItems.length}`);
    }
  }

  // ─── P2 #10: GET /revenue format ───
  console.log("\n─── P2 #10: Format /revenue ───");
  {
    const res = await request(`/v1/partners/${PARTNER_ID}/revenue`, { token });
    const j = res.json;
    if (j?.entries || j?.pagination) {
      log("P2-10", "GET /revenue", "fail", `Toujours format ledger — { entries, pagination } au lieu de résumé par service`, Object.keys(j));
    } else if (j?.summary || j?.byService || j?.by_service) {
      log("P2-10", "GET /revenue", "fix", "Format résumé par service détecté", Object.keys(j));
    } else {
      log("P2-10", "GET /revenue", "partial", `Format inconnu — keys: ${JSON.stringify(Object.keys(j ?? {}))}`, j);
    }
  }

  // ─── P2 #11: GET /ledger format ───
  console.log("\n─── P2 #11: Format /ledger ───");
  {
    const res = await request(`/v1/partners/${PARTNER_ID}/ledger`, { token });
    const j = res.json;
    if (j?.items && j?.pagination) {
      log("P2-11", "GET /ledger", "fail", `Toujours format legacy — { items, pagination } au lieu de { data, meta }`, Object.keys(j));
    } else if (j?.data && j?.meta) {
      log("P2-11", "GET /ledger", "fix", "Format standard { data, meta } détecté", Object.keys(j));
    } else {
      log("P2-11", "GET /ledger", "partial", `Format inconnu — keys: ${JSON.stringify(Object.keys(j ?? {}))}`, j);
    }
  }

  // ─── P2 #12: GET /wallet format ───
  console.log("\n─── P2 #12: Format /wallet ───");
  {
    const res = await request(`/v1/partners/${PARTNER_ID}/wallet`, { token });
    const j = res.json;
    if (j?.wallet) {
      const w = j.wallet;
      const hasRecent = !!w.recent_movements || !!j.recent_movements;
      log("P2-12", "GET /wallet", hasRecent ? "fix" : "partial", `Format { wallet: {...} } — recent_movements: ${hasRecent ? "PRÉSENT" : "ABSENT"}`, { keys: Object.keys(w), hasRecent });
    } else if (j?.data?.balance_fcfa !== undefined) {
      log("P2-12", "GET /wallet", "fix", "Format legacy { data: { balance_fcfa } }", Object.keys(j.data));
    } else {
      log("P2-12", "GET /wallet", "partial", `Format inconnu — keys: ${JSON.stringify(Object.keys(j ?? {}))}`, j);
    }
  }

  // ─── P2 #17: GET /drivers/{driverId} acceptance_rate_pct ───
  console.log("\n─── P2 #17: acceptance_rate_pct ───");
  {
    const driversRes = await request(`/v1/partners/${PARTNER_ID}/drivers`, { token });
    const drivers = driversRes.json?.items ?? driversRes.json?.data ?? [];
    const driverId = drivers[0]?.id ?? drivers[0]?.driver_id;
    if (driverId) {
      const res = await request(`/v1/partners/${PARTNER_ID}/drivers/${driverId}`, { token });
      const d = res.json?.data ?? res.json?.driver ?? res.json;
      const ar = d?.acceptance_rate_pct;
      if (ar != null && typeof ar === "number" && ar > 0) {
        log("P2-17", "acceptance_rate_pct", "fix", `Valeur calculée: ${ar}`, { acceptance_rate_pct: ar });
      } else {
        log("P2-17", "acceptance_rate_pct", "fail", `Toujours null/0 — valeur: ${ar}`, { acceptance_rate_pct: ar });
      }
    } else {
      log("P2-17", "acceptance_rate_pct", "fail", "Aucun chauffeur trouvé");
    }
  }

  // ─── P2 #20: Socket.io notifications ───
  console.log("\n─── P2 #20: Socket.io notifications ───");
  {
    // Check if /v1/notifications endpoint exists and if there's a socket config
    const res = await request(`/v1/partners/${PARTNER_ID}/dashboard`, { token });
    const d = res.json?.dashboard ?? res.json?.data ?? {};
    const hasRealtime = !!d.realtime || !!res.json?.realtime;
    log("P2-20", "Socket.io notifications", "fail", hasRealtime ? "Config realtime présente dans dashboard (mais notifications socket non confirmé)" : "Aucun socket temps réel pour les notifications — polling HTTP uniquement", { hasRealtime });
  }

  // ─── P2 #21: GET /drivers/{driverId}/wallet/transactions balance_after_xof ───
  console.log("\n─── P2 #21: balance_after_xof ───");
  {
    const driversRes = await request(`/v1/partners/${PARTNER_ID}/drivers`, { token });
    const drivers = driversRes.json?.items ?? driversRes.json?.data ?? [];
    const driverId = drivers[0]?.id ?? drivers[0]?.driver_id;
    if (driverId) {
      const res = await request(`/v1/partners/${PARTNER_ID}/drivers/${driverId}/wallet/transactions`, { token });
      const items = res.json?.items ?? res.json?.data ?? [];
      const firstItem = items[0];
      const hasBalanceAfter = firstItem && (firstItem.balance_after_xof !== undefined || firstItem.balance_after !== undefined);
      if (hasBalanceAfter) {
        log("P2-21", "balance_after_xof", "fix", `Champ présent — valeur: ${firstItem.balance_after_xof ?? firstItem.balance_after}`, firstItem);
      } else {
        log("P2-21", "balance_after_xof", "fail", `Champ ABSENT — keys: ${JSON.stringify(Object.keys(firstItem ?? {}))}`, firstItem);
      }
    } else {
      log("P2-21", "balance_after_xof", "fail", "Aucun chauffeur trouvé");
    }
  }

  // ─── P2 #22: GET /trips/{tripId} vehicle object ───
  console.log("\n─── P2 #22: Vehicle embarqué trip ───");
  {
    const tripsRes = await request(`/v1/partners/${PARTNER_ID}/trips`, { token });
    const trips = tripsRes.json?.items ?? tripsRes.json?.data ?? [];
    const tripId = trips[0]?.id;
    if (tripId) {
      const res = await request(`/v1/partners/${PARTNER_ID}/trips/${tripId}`, { token });
      const t = res.json?.data ?? res.json?.trip ?? res.json;
      const hasVehicle = t?.vehicle && typeof t.vehicle === "object";
      if (hasVehicle) {
        log("P2-22", "GET /trips/{tripId} vehicle", "fix", `Objet vehicle présent — brand: ${t.vehicle.brand}, model: ${t.vehicle.model}`, t.vehicle);
      } else {
        log("P2-22", "GET /trips/{tripId} vehicle", "fail", `Objet vehicle ABSENT — vehicle_id: ${t?.vehicle_id}`, { keys: Object.keys(t ?? {}), vehicle_id: t?.vehicle_id });
      }
    } else {
      log("P2-22", "GET /trips/{tripId} vehicle", "fail", "Aucun trip trouvé");
    }
  }

  // ─── P2 #23: GET /driver-performance total_km ───
  console.log("\n─── P2 #23: total_km driver-performance ───");
  {
    const res = await request(`/v1/partners/${PARTNER_ID}/driver-performance`, { token });
    const items = res.json?.items ?? res.json?.data ?? [];
    const firstItem = items[0];
    const hasTotalKm = firstItem && firstItem.total_km !== undefined && firstItem.total_km !== null;
    if (hasTotalKm) {
      log("P2-23", "total_km", "fix", `Champ présent — valeur: ${firstItem.total_km}`, { total_km: firstItem.total_km });
    } else {
      log("P2-23", "total_km", "fail", `Champ ABSENT ou null — keys: ${JSON.stringify(Object.keys(firstItem ?? {}))}`, firstItem);
    }
  }

  // ─── P2 #24: GET /driver-performance?search= ───
  console.log("\n─── P2 #24: Search driver-performance ───");
  {
    const all = await request(`/v1/partners/${PARTNER_ID}/driver-performance`, { token });
    const searched = await request(`/v1/partners/${PARTNER_ID}/driver-performance?search=zzzznotexist`, { token });
    const allItems = all.json?.items ?? all.json?.data ?? [];
    const searchItems = searched.json?.items ?? searched.json?.data ?? [];
    if (searchItems.length === 0 && allItems.length > 0) {
      log("P2-24", "GET /driver-performance?search=", "fix", `Recherche OK — 0 résultats pour "zzzznotexist" (vs ${allItems.length})`, { all: allItems.length, search: searchItems.length });
    } else if (searchItems.length === allItems.length && allItems.length > 0) {
      log("P2-24", "GET /driver-performance?search=", "fail", `Recherche IGNORE — ${searchItems.length} résultats (même count que sans filtre=${allItems.length})`, { all: allItems.length, search: searchItems.length });
    } else {
      log("P2-24", "GET /driver-performance?search=", "partial", `Résultat incertain — all=${allItems.length}, search=${searchItems.length}`);
    }
  }

  // ─── P2 #25: POST /wallet/top-up ───
  console.log("\n─── P2 #25: POST /wallet/top-up ───");
  {
    const res = await request(`/v1/partners/${PARTNER_ID}/wallet/top-up`, {
      method: "POST",
      token,
      body: { amount_fcfa: 1000, method: "mobile_money" },
    });
    if (res.status === 200 || res.status === 201) {
      log("P2-25", "POST /wallet/top-up", "fix", `Route existe — HTTP ${res.status}`, res.json);
    } else if (res.status === 404) {
      log("P2-25", "POST /wallet/top-up", "fail", `Route inexistante — HTTP 404`, res.json);
    } else {
      log("P2-25", "POST /wallet/top-up", "partial", `HTTP ${res.status}`, res.json);
    }
  }

  // ─── P2 #26: GET /freight-requests ───
  console.log("\n─── P2 #26: GET /freight-requests ───");
  {
    const res = await request(`/v1/partners/${PARTNER_ID}/freight-requests`, { token });
    if (res.status === 200) {
      const items = res.json?.items ?? res.json?.data ?? [];
      log("P2-26", "GET /freight-requests", "fix", `Route existe — HTTP 200, ${items.length} items`, { status: res.status, itemCount: items.length });
    } else if (res.status === 404) {
      log("P2-26", "GET /freight-requests", "fail", `Route inexistante — HTTP 404`, res.json);
    } else {
      log("P2-26", "GET /freight-requests", "partial", `HTTP ${res.status}`, res.json);
    }
  }

  // ─── P2 #27: GET /reports ───
  console.log("\n─── P2 #27: GET /reports ───");
  {
    const res = await request(`/v1/partners/${PARTNER_ID}/reports`, { token });
    const items = res.json?.items ?? res.json?.data ?? [];
    const firstItem = items[0];
    const hasDriverBreakdown = firstItem && (firstItem.drivers !== undefined || firstItem.by_driver !== undefined);
    const hasServiceBreakdown = firstItem && (firstItem.services !== undefined || firstItem.by_service !== undefined);
    const hasKyc = firstItem && (firstItem.kyc !== undefined || firstItem.compliance !== undefined);
    if (hasDriverBreakdown || hasServiceBreakdown || hasKyc) {
      log("P2-27", "GET /reports", "fix", "Rapports enrichis détectés", { hasDriverBreakdown, hasServiceBreakdown, hasKyc });
    } else {
      log("P2-27", "GET /reports", "partial", `Toujours synthèse par période uniquement — keys: ${JSON.stringify(Object.keys(firstItem ?? {}))}`, firstItem);
    }
  }

  // ─── P2 #26b: POST /freight-requests/{requestId}/quote ───
  console.log("\n─── P2 #26b: POST /freight-requests/{id}/quote ───");
  {
    // Try with a dummy ID
    const res = await request(`/v1/partners/${PARTNER_ID}/freight-requests/dummy-id/quote`, {
      method: "POST",
      token,
      body: { amount_fcfa: 50000 },
    });
    if (res.status === 404) {
      log("P2-26b", "POST /freight-requests/{id}/quote", "fail", "Route inexistante — HTTP 404", res.json);
    } else if (res.status === 200 || res.status === 201) {
      log("P2-26b", "POST /freight-requests/{id}/quote", "fix", `Route existe — HTTP ${res.status}`, res.json);
    } else {
      log("P2-26b", "POST /freight-requests/{id}/quote", "partial", `HTTP ${res.status} (peut être normal si l'ID n'existe pas)`, res.json);
    }
  }

  // ─── Résumé ───
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  RÉSUMÉ DU SCAN");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const fixed = results.filter(r => r.status === "fix");
  const failed = results.filter(r => r.status === "fail");
  const partial = results.filter(r => r.status === "partial");

  console.log(`✅ Fixés:    ${fixed.length}`);
  console.log(`❌ Échoués:  ${failed.length}`);
  console.log(`⚠️  Partiels: ${partial.length}`);
  console.log();

  if (fixed.length > 0) {
    console.log("✅ Demandes fixées:");
    fixed.forEach(r => console.log(`   ${r.id} — ${r.label}`));
    console.log();
  }
  if (failed.length > 0) {
    console.log("❌ Demandes non traitées:");
    failed.forEach(r => console.log(`   ${r.id} — ${r.label}`));
    console.log();
  }
  if (partial.length > 0) {
    console.log("⚠️  Demandes partielles:");
    partial.forEach(r => console.log(`   ${r.id} — ${r.label}`));
    console.log();
  }

  // Output JSON for parsing
  console.log("\n--- JSON RESULTS ---");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
