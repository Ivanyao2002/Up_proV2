import type {
  AssistantAction,
  AssistantApiResponse,
  AssistantResponse,
} from "@/features/assistant/types";
import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";
import { parseMalformedFindId, isValidEntityId } from "@/features/assistant/lib/entityId";
import { defaultMessageForAction } from "./defaultMessage";

const ENTITY_KEYS: AdminEntityKey[] = [
  "dashboard", "map", "trips", "sos", "sos-incidents",
  "franchises", "zones", "partners", "drivers", "vehicles", "kyc", "clients",
  "finance", "transactions", "withdrawals", "driver-transfers", "commissions",
  "commission-rules", "reconciliation", "promos", "campaigns", "banners",
  "tickets", "chat", "disputes", "roles", "pricing", "dispatch-rules",
  "integrations", "weather", "audit", "general",
];

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export function parseAssistantLlmOutput(raw: string): AssistantResponse {
  try {
    const parsed = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
    const action = normalizeAction(parsed.action ?? parsed);
    let message = pickMessage(parsed);
    if (!message && action) {
      message = defaultMessageForAction(action);
    }
    if (!message) {
      message = "Je n'ai pas pu formuler une réponse.";
    }
    return { message, action };
  } catch {
    return {
      message: raw.trim() || "Réponse non interprétable.",
      action: null,
    };
  }
}

function pickMessage(parsed: Record<string, unknown>): string {
  for (const key of ["message", "text", "reply", "response", "content"]) {
    const value = parsed[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function parseEntity(value: unknown): AdminEntityKey | null {
  if (typeof value !== "string") return null;
  return ENTITY_KEYS.includes(value as AdminEntityKey)
    ? (value as AdminEntityKey)
    : null;
}

function normalizeAction(action: unknown): AssistantAction | null {
  if (!action || typeof action !== "object") return null;
  const a = action as Record<string, unknown>;
  const type = a.type;
  if (typeof type !== "string") return null;

  switch (type) {
    case "NAVIGATE":
      return typeof a.path === "string" && a.path.startsWith("/admin")
        ? { type: "NAVIGATE", path: a.path }
        : null;
    case "LIST_ENTITY": {
      const entity = parseEntity(a.entity);
      return entity ? { type: "LIST_ENTITY", entity } : null;
    }
    case "FIND_ENTITY": {
      const entity = parseEntity(a.entity);
      const query =
        typeof a.query === "string"
          ? a.query.trim()
          : typeof a.search === "string"
            ? a.search.trim()
            : "";
      return entity && query ? { type: "FIND_ENTITY", entity, query } : null;
    }
    case "OPEN_RELATED": {
      const target = parseEntity(a.targetEntity);
      const source = parseEntity(a.sourceEntity);
      const sourceQuery =
        typeof a.sourceQuery === "string"
          ? a.sourceQuery.trim()
          : typeof a.query === "string"
            ? a.query.trim()
            : "";
      return target && source && sourceQuery
        ? { type: "OPEN_RELATED", targetEntity: target, sourceEntity: source, sourceQuery }
        : null;
    }
    case "OPEN_ENTITY": {
      const entity = parseEntity(a.entity);
      const rawId =
        typeof a.id === "string"
          ? a.id
          : typeof a.entityId === "string"
            ? a.entityId
            : null;
      if (!entity || !rawId) return null;

      const malformed = parseMalformedFindId(rawId);
      if (malformed) {
        return { type: "FIND_ENTITY", entity, query: malformed.query };
      }
      if (!isValidEntityId(rawId)) {
        return { type: "FIND_ENTITY", entity, query: rawId.trim() };
      }
      return { type: "OPEN_ENTITY", entity, id: rawId };
    }
    case "OPEN_DRIVER_DETAIL":
      return typeof a.driverId === "string"
        ? { type: "OPEN_DRIVER_DETAIL", driverId: a.driverId }
        : null;
    case "OPEN_TRIP_DETAIL":
      return typeof a.tripId === "string"
        ? { type: "OPEN_TRIP_DETAIL", tripId: a.tripId }
        : null;
    case "OPEN_CLIENT_DETAIL":
      return typeof a.clientId === "string"
        ? { type: "OPEN_CLIENT_DETAIL", clientId: a.clientId }
        : null;
    case "OPEN_VEHICLE_DETAIL":
      return typeof a.vehicleId === "string"
        ? { type: "OPEN_VEHICLE_DETAIL", vehicleId: a.vehicleId }
        : null;
    case "LIST_TRIPS":
      return {
        type: "LIST_TRIPS",
        status: typeof a.status === "string" ? a.status : undefined,
      };
    case "LIST_DRIVERS":
      return { type: "LIST_DRIVERS" };
    case "LIST_VEHICLES":
    case "LIST_VEHICLE":
    case "OPEN_VEHICLES":
      return { type: "LIST_VEHICLES" };
    case "FIND_VEHICLE":
      return typeof a.query === "string" && a.query.trim()
        ? { type: "FIND_VEHICLE", query: a.query.trim() }
        : typeof a.plate === "string" && a.plate.trim()
          ? { type: "FIND_VEHICLE", query: a.plate.trim() }
          : null;
    case "FIND_DRIVER":
      return typeof a.query === "string" && a.query.trim()
        ? { type: "FIND_DRIVER", query: a.query.trim() }
        : null;
    case "FIND_TRIP":
      return typeof a.query === "string" && a.query.trim()
        ? { type: "FIND_TRIP", query: a.query.trim() }
        : null;
    default:
      return null;
  }
}

export function toClientAction(
  action: AssistantAction | null | undefined
): AssistantAction | null {
  if (!action) return null;
  if (
    action.type === "FIND_DRIVER" ||
    action.type === "FIND_TRIP" ||
    action.type === "FIND_VEHICLE" ||
    action.type === "FIND_ENTITY" ||
    action.type === "OPEN_RELATED"
  ) {
    return null;
  }
  return action;
}

export function withResolvedAction(
  base: AssistantResponse,
  resolved: AssistantAction | null,
  candidates?: AssistantApiResponse["candidates"]
): AssistantApiResponse {
  return {
    message: base.message,
    action: resolved ?? toClientAction(base.action),
    candidates,
  };
}
