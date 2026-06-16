import type {
  AssistantAction,
  AssistantApiResponse,
  AssistantResponse,
} from "@/features/assistant/types";
import {
  entityDetailPath,
  entityListPath,
  type AdminEntityKey,
} from "@/features/assistant/catalog/adminEntities";
import { resolveOpenRelated } from "./relationalResolver";
import {
  resolveFindEntity,
  resolveListEntity,
  resolveOpenEntity,
} from "./entityResolver";
import { parseAssistantLlmOutput, withResolvedAction } from "./parseResponse";
import { isValidEntityId, parseMalformedFindId } from "@/features/assistant/lib/entityId";

function legacyToFind(
  action: AssistantAction
): { entity: AdminEntityKey; query: string } | null {
  switch (action.type) {
    case "FIND_DRIVER":
      return { entity: "drivers", query: action.query };
    case "FIND_TRIP":
      return { entity: "trips", query: action.query };
    case "FIND_VEHICLE":
      return { entity: "vehicles", query: action.query };
    default:
      return null;
  }
}

function legacyToOpen(
  action: AssistantAction
): { entity: AdminEntityKey; id: string } | null {
  switch (action.type) {
    case "OPEN_DRIVER_DETAIL":
      return { entity: "drivers", id: action.driverId };
    case "OPEN_TRIP_DETAIL":
      return { entity: "trips", id: action.tripId };
    case "OPEN_CLIENT_DETAIL":
      return { entity: "clients", id: action.clientId };
    case "OPEN_VEHICLE_DETAIL":
      return { entity: "vehicles", id: action.vehicleId };
    default:
      return null;
  }
}

function legacyToList(action: AssistantAction): AssistantApiResponse | null {
  switch (action.type) {
    case "LIST_DRIVERS":
      return resolveListEntity("drivers");
    case "LIST_VEHICLES":
      return resolveListEntity("vehicles");
    case "LIST_TRIPS":
      if (action.status && action.status !== "all") {
        return {
          message: `J'affiche les courses (${action.status}).`,
          action: {
            type: "NAVIGATE",
            path: `${entityListPath("trips")}?status=${encodeURIComponent(action.status)}`,
          },
        };
      }
      return resolveListEntity("trips");
    default:
      return null;
  }
}

export async function resolveAssistantAction(
  parsed: AssistantResponse,
  authHeader: string | null
): Promise<AssistantApiResponse> {
  const action = parsed.action;
  if (!action) {
    return { message: parsed.message, action: null };
  }

  try {
    switch (action.type) {
      case "LIST_ENTITY":
        return resolveListEntity(action.entity);
      case "FIND_ENTITY":
        return resolveFindEntity(action.entity, action.query, authHeader);
      case "OPEN_ENTITY":
        if (!isValidEntityId(action.id)) {
          const malformed = parseMalformedFindId(action.id);
          const query = malformed?.query ?? action.id.trim();
          return resolveFindEntity(action.entity, query, authHeader);
        }
        return resolveOpenEntity(action.entity, action.id);
      case "OPEN_RELATED":
        return resolveOpenRelated(
          action.targetEntity,
          action.sourceEntity,
          action.sourceQuery,
          authHeader
        );
      case "NAVIGATE":
        return withResolvedAction(parsed, action);
      default: {
        const list = legacyToList(action);
        if (list) return list;
        const find = legacyToFind(action);
        if (find) return resolveFindEntity(find.entity, find.query, authHeader);
        const open = legacyToOpen(action);
        if (open) return resolveOpenEntity(open.entity, open.id);
        return withResolvedAction(parsed, action);
      }
    }
  } catch {
    return {
      message: `${parsed.message}\n\n(Je n'ai pas pu interroger l'API — vérifiez votre session.)`,
      action: toSafeNavigate(action),
    };
  }
}

function toSafeNavigate(action: AssistantAction): AssistantAction | null {
  if (action.type === "LIST_ENTITY") {
    return { type: "NAVIGATE", path: entityListPath(action.entity) };
  }
  if (action.type === "OPEN_ENTITY") {
    if (!isValidEntityId(action.id)) {
      return { type: "LIST_ENTITY", entity: action.entity };
    }
    const path =
      entityDetailPath(action.entity, action.id) ??
      entityListPath(action.entity);
    return { type: "NAVIGATE", path };
  }

  const list = legacyToList(action);
  if (list?.action) return list.action;
  const open = legacyToOpen(action);
  if (open) {
    const path =
      entityDetailPath(open.entity, open.id) ?? entityListPath(open.entity);
    return { type: "NAVIGATE", path };
  }
  if (action.type === "NAVIGATE") return action;
  return null;
}

export { parseAssistantLlmOutput };
