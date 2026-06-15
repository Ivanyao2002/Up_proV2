import type { AssistantPageContext } from "@/features/assistant/types";
import type { AssistantResponse } from "@/features/assistant/types";
import {
  matchEntityFindIntent,
  matchEntityListIntent,
} from "@/features/assistant/catalog/adminEntities";
import { matchOpenFirstEntityIntent } from "@/features/assistant/lib/firstEntityIntent";
import {
  entityListPathWithQuery,
  matchEntityListFilterIntent,
} from "@/features/assistant/lib/entityListFilters";
import { matchAdvancedFilterIntent } from "./advancedFilterIntent";
import { matchRelationalIntent } from "./relationalIntent";
import { matchPersonLookupIntent } from "./personLookupIntent";
import { extractDriverNameQuery, isActionIntent } from "./driverQueryExtract";
import {
  detectConfirmIntent,
  detectRelativeIntent,
  isSummaryRequest,
} from "./contextIntent";
import {
  isGenericSummaryRequest,
  matchAnalyticsIntent,
  parseSummaryTarget,
} from "./summaryIntent";
import { matchSpecialIntent, specialIntentToken } from "./specialIntent";

/** Plaque ivoirienne ex. CI-4012-AA-01 */
const PLATE_PATTERN =
  /\b([A-Z]{2}-\d{3,4}-[A-Z]{1,3}-\d{2})\b/i;

export function normalizePlate(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function extractPlate(text: string): string | null {
  const match = text.match(PLATE_PATTERN);
  return match?.[1]?.toUpperCase() ?? null;
}

export async function detectDirectIntent(
  userMessage: string,
  context?: AssistantPageContext,
  authHeader?: string
): Promise<AssistantResponse | null> {
  const text = userMessage.trim();

  if (authHeader && isActionIntent(text)) {
    const confirm = await detectConfirmIntent(text, context, authHeader);
    if (confirm) {
      return {
        message: confirm.message,
        action: null,
        confirmation: confirm.confirmation ?? null,
      };
    }
  }

  const analytics = matchAnalyticsIntent(text);
  if (analytics) {
    return { message: `__ANALYTICS__:${analytics}`, action: null };
  }

  const special = matchSpecialIntent(text, context);
  if (special && !(isActionIntent(text) && special.kind === "KYC_MISSING")) {
    return { message: specialIntentToken(special), action: null };
  }

  if (isSummaryRequest(text)) {
    const target = parseSummaryTarget(text);
    if (target) {
      return {
        message: `__SUMMARIZE_QUERY__:${target.entity}:${encodeURIComponent(target.query)}`,
        action: null,
      };
    }

    if (isGenericSummaryRequest(text) && context?.entityId && context.entity) {
      return { message: "__SUMMARIZE__", action: null };
    }

    if (isGenericSummaryRequest(text) && context?.isListPage && context.entity) {
      return { message: "__SUMMARIZE_FIRST__", action: null };
    }

    if (isGenericSummaryRequest(text)) {
      return { message: "__SUMMARIZE_FIRST__", action: null };
    }
  }

  const relative = detectRelativeIntent(text, context);
  if (relative) return relative;

  const firstEntity = matchOpenFirstEntityIntent(text);
  if (firstEntity) {
    return {
      message: `__OPEN_FIRST__:${firstEntity}`,
      action: null,
    };
  }

  const advancedFilter = matchAdvancedFilterIntent(text);
  if (advancedFilter) {
    return {
      message: advancedFilter.message,
      action: {
        type: "NAVIGATE",
        path: entityListPathWithQuery(
          advancedFilter.entity,
          advancedFilter.queryParams
        ),
      },
    };
  }

  const filterMatch = matchEntityListFilterIntent(text);
  if (filterMatch) {
    return {
      message: filterMatch.message,
      action: {
        type: "NAVIGATE",
        path: entityListPathWithQuery(filterMatch.entity, filterMatch.queryParams),
      },
    };
  }

  const relational = matchRelationalIntent(text);
  if (relational) {
    return {
      message: relational.previewMessage,
      action: {
        type: "OPEN_RELATED",
        targetEntity: relational.targetEntity,
        sourceEntity: relational.sourceEntity,
        sourceQuery: relational.sourceQuery,
      },
    };
  }

  const plate = extractPlate(text);
  if (plate) {
    return {
      message: `Recherche du véhicule ${plate}…`,
      action: { type: "FIND_ENTITY", entity: "vehicles", query: plate },
    };
  }

  const person = matchPersonLookupIntent(text);
  if (person) {
    return {
      message: `Recherche de ${person.query}…`,
      action: { type: "FIND_ENTITY", entity: person.entity, query: person.query },
    };
  }

  const find = matchEntityFindIntent(text);
  if (find) {
    return {
      message: `Recherche en cours…`,
      action: { type: "FIND_ENTITY", entity: find.entity, query: find.query },
    };
  }

  const listEntity = matchEntityListIntent(text);
  if (listEntity) {
    return {
      message: `J'ouvre la liste.`,
      action: { type: "LIST_ENTITY", entity: listEntity },
    };
  }

  if (/courses en cours|course en cours/i.test(text)) {
    return {
      message: "J'affiche les courses en cours.",
      action: {
        type: "NAVIGATE",
        path: entityListPathWithQuery("trips", { status: "in_progress" }),
      },
    };
  }

  if (/recharg(er|e).*chauffeur|recharge chauffeur/i.test(text) && !/\d/.test(text)) {
    return {
      message: "J'ouvre la page des recharges chauffeurs.",
      action: { type: "NAVIGATE", path: "/admin/finance/driver-transfers" },
    };
  }

  return null;
}

export type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";
