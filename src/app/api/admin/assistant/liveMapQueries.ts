import { LINKS } from "@/core/api/links";
import { entityListPath } from "@/features/assistant/catalog/adminEntities";
import type { AssistantApiResponse } from "@/features/assistant/types";
import { assistantApiGet, record, str } from "./assistantApiClient";
import { searchEntityMatches, getItemId, getItemLabel } from "./entityResolver";

interface LiveMapPayload {
  drivers?: Record<string, unknown>[];
  items?: Record<string, unknown>[];
}

export async function buildLiveOnlineReport(
  authHeader: string
): Promise<AssistantApiResponse> {
  const data = await assistantApiGet<LiveMapPayload>(LINKS.admin.v1.liveMap, authHeader);
  const drivers = data?.drivers ?? data?.items ?? [];
  const online = drivers.filter((d) => {
    const s = str(d.availability_status ?? d.status ?? d.availability).toLowerCase();
    return s === "online" || s === "on_trip" || s === "available";
  });

  const sample = online.slice(0, 8).map((d) => {
    const name = str(d.display_name ?? d.driver_name ?? d.driver_code);
    const lat = d.lat ?? d.latitude;
    const lng = d.lng ?? d.longitude;
    return `• ${name}${lat != null && lng != null ? ` (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})` : ""}`;
  });

  return {
    message: [
      `Ops live — chauffeurs en ligne`,
      `Total sur la carte : ${drivers.length}`,
      `En ligne / en course : ${online.length}`,
      sample.length ? `\nExemples :\n${sample.join("\n")}` : "",
      "",
      "Ouvrez la carte live pour le détail.",
    ]
      .filter(Boolean)
      .join("\n"),
    action: { type: "NAVIGATE", path: entityListPath("map") },
  };
}

export async function buildDriverLocationReport(
  query: string,
  authHeader: string
): Promise<AssistantApiResponse> {
  const matches = await searchEntityMatches("drivers", query, authHeader);
  if (!matches.length) {
    return { message: `Chauffeur introuvable : « ${query} ».`, action: null };
  }
  const id = getItemId(matches[0]!);
  const label = getItemLabel("drivers", matches[0]!);

  const data = await assistantApiGet<LiveMapPayload>(LINKS.admin.v1.liveMap, authHeader);
  const drivers = data?.drivers ?? data?.items ?? [];
  const found = drivers.find(
    (d) => String(d.driver_id ?? d.id) === id || str(d.driver_code) === id
  );

  if (!found) {
    const availability = str(
      matches[0]!.availability_status ?? matches[0]!.availability
    ).toLowerCase();
    return {
      message: [
        `Position — ${label}`,
        availability === "offline" || availability === "—"
          ? "Chauffeur hors ligne ou non visible sur la carte live."
          : "Position non trouvée sur la carte (données live indisponibles).",
        "",
        "Consultez la carte live ou la fiche chauffeur.",
      ].join("\n"),
      action: { type: "OPEN_ENTITY", entity: "drivers", id },
    };
  }

  const lat = found.lat ?? found.latitude;
  const lng = found.lng ?? found.longitude;
  const status = str(found.availability_status ?? found.status);

  return {
    message: [
      `Position live — ${label}`,
      `Statut : ${status}`,
      lat != null && lng != null
        ? `Coordonnées : ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
        : "Coordonnées indisponibles",
      "",
      "Ouvrir la carte live pour visualiser.",
    ].join("\n"),
    action: { type: "NAVIGATE", path: entityListPath("map") },
  };
}
