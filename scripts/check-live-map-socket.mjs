/**
 * Vérifie GET /v1/admin/live-map + socket admin:live:locations
 * Usage: node scripts/check-live-map-socket.mjs
 */
import { io } from "socket.io-client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://api.upjunoo-dev.tech";
const EMAIL = process.env.TEST_ADMIN_EMAIL ?? "dev.admin@upjunoo-dev.tech";
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "Upjunoo@Dev2026!";
const LISTEN_MS = Number(process.env.LIVE_MAP_SOCKET_LISTEN_MS ?? 25_000);

async function login() {
  const res = await fetch(`${API}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Type": "back-office",
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const json = await res.json();
  const token = json.accessToken ?? json.session?.access_token;
  if (!token) throw new Error(`Login failed HTTP ${res.status}`);
  return token;
}

function readCoords(driver) {
  const loc = driver.location ?? {};
  const lat = loc.lat ?? loc.latitude ?? driver.lat ?? driver.latitude;
  const lng = loc.lng ?? loc.longitude ?? driver.lng ?? driver.longitude;
  return { lat, lng, loc };
}

async function fetchLiveMap(token) {
  const res = await fetch(`${API}/v1/admin/live-map?limit=500`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Client-Type": "back-office",
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`live-map HTTP ${res.status}: ${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

function summarizeDrivers(payload) {
  const drivers = payload.drivers ?? payload.items ?? [];
  const meta = payload.meta ?? {};
  console.log("\n=== GET /v1/admin/live-map ===");
  console.log(`HTTP drivers: ${drivers.length}`);
  console.log(
    `meta: onlineInDatabase=${meta.onlineInDatabase ?? "?"}, withRecentLocation=${meta.withRecentLocation ?? "?"}, maxLocationAgeSeconds=${meta.maxLocationAgeSeconds ?? "?"}`
  );
  const rt = meta.realtime;
  if (rt) {
    console.log(`meta.realtime: event=${rt.event}, room=${rt.room}, url=${rt.url ?? API}`);
  }

  const withCoords = [];
  const onlineNoCoords = [];
  for (const d of drivers) {
    const { lat, lng, loc } = readCoords(d);
    const name =
      d.profile?.displayName ?? d.displayName ?? d.vehicleLabel ?? d.id?.slice(0, 8);
    const status = d.availabilityStatus ?? d.availability_status ?? "?";
    if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      withCoords.push({
        id: d.id,
        name,
        status,
        lat: Number(lat),
        lng: Number(lng),
        age: loc.ageSeconds ?? loc.age_seconds,
        recordedAt: loc.recordedAt ?? loc.recorded_at,
        plate: d.vehicle?.plateNumber ?? d.vehicle?.plate_number,
      });
    } else {
      onlineNoCoords.push({ id: d.id, name, status });
    }
  }

  console.log(`\nAvec coordonnées GPS: ${withCoords.length}`);
  for (const d of withCoords.slice(0, 10)) {
    console.log(
      `  • ${d.name} [${d.status}] ${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}` +
        (d.plate ? ` · ${d.plate}` : "") +
        (d.age != null ? ` · age ${d.age}s` : "")
    );
  }
  if (withCoords.length > 10) console.log(`  … +${withCoords.length - 10} autres`);

  if (onlineNoCoords.length) {
    console.log(`\nSans coordonnées (mais listés): ${onlineNoCoords.length}`);
    for (const d of onlineNoCoords.slice(0, 5)) {
      console.log(`  • ${d.name} [${d.status}] id=${d.id}`);
    }
  }

  return { drivers, meta, withCoords };
}

function listenSocket(token, eventName) {
  return new Promise((resolve) => {
    const events = [];
    const socket = io(API, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: false,
      timeout: 20_000,
    });

    const done = (summary) => {
      socket.disconnect();
      resolve(summary);
    };

    const timer = setTimeout(() => {
      done({ events, connected, joinedRoom, error });
    }, LISTEN_MS);

    let connected = false;
    let joinedRoom = false;
    let error = null;

    socket.on("connect", () => {
      connected = true;
      console.log("\n=== Socket connecté ===");
      socket.emit("join", { room: "admin:live-map" });
    });

    socket.on("joined", (payload) => {
      joinedRoom = true;
      console.log("joined:", JSON.stringify(payload));
    });

    socket.on("connected", (payload) => {
      console.log("connected:", JSON.stringify(payload).slice(0, 300));
    });

    socket.on("connect_error", (err) => {
      error = err?.message ?? String(err);
      console.error("connect_error:", error);
    });

    socket.on("join_denied", (payload) => {
      error = `join_denied: ${JSON.stringify(payload)}`;
      console.error(error);
    });

    socket.on(eventName, (payload) => {
      const at = payload?.at ?? "?";
      const batch = payload?.drivers ?? [];
      events.push({ at, count: batch.length, drivers: batch });
      console.log(`\n>>> ${eventName} @ ${at} — ${batch.length} driver(s)`);
      for (const d of batch.slice(0, 5)) {
        console.log(
          `    id=${d.id} lat=${d.latitude} lng=${d.longitude} speed=${d.speedKmh ?? "?"} age=${d.ageSeconds ?? "?"}s`
        );
      }
      if (batch.length > 5) console.log(`    … +${batch.length - 5}`);
    });

    socket.onAny((ev, ...args) => {
      if (
        ev === eventName ||
        ev === "connect" ||
        ev === "joined" ||
        ev === "connected" ||
        ev === "connect_error"
      ) {
        return;
      }
      if (String(ev).includes("live") || String(ev).includes("location")) {
        console.log(`[socket event] ${ev}`, JSON.stringify(args[0]).slice(0, 200));
      }
    });
  });
}

async function main() {
  console.log(`API: ${API}`);
  console.log(`Écoute socket: ${LISTEN_MS / 1000}s\n`);

  const token = await login();
  console.log("Login admin OK");

  const liveMap = await fetchLiveMap(token);
  const { meta, withCoords } = summarizeDrivers(liveMap);

  const eventName = meta.realtime?.event ?? "admin:live:locations";
  console.log(`\nÉcoute de l'événement « ${eventName} »…`);

  const socketResult = await listenSocket(token, eventName);

  console.log("\n=== Bilan socket ===");
  console.log(`Connecté: ${socketResult.connected}`);
  console.log(`Room join OK: ${socketResult.joinedRoom}`);
  console.log(`Batches reçus: ${socketResult.events.length}`);
  if (socketResult.error) console.log(`Erreur: ${socketResult.error}`);

  if (socketResult.events.length === 0 && withCoords.length > 0) {
    console.log(
      "\n⚠️  Des chauffeurs ont une position HTTP mais AUCUN batch socket en " +
        LISTEN_MS / 1000 +
        "s — vérifiez push backend ou chauffeur vraiment immobile (batch peut être espacé)."
    );
  } else if (socketResult.events.length === 0 && withCoords.length === 0) {
    console.log("\n⚠️  Aucune position HTTP ni socket — pas de chauffeur tracké côté API.");
  } else if (socketResult.events.length > 0) {
    const ids = new Set();
    for (const e of socketResult.events) {
      for (const d of e.drivers) ids.add(d.id);
    }
    console.log(`\n✅ Socket OK — ${ids.size} chauffeur(s) distinct(s) vus en temps réel.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
