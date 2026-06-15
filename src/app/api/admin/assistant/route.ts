import { NextRequest, NextResponse } from "next/server";
import type {
  AssistantChatMessage,
  AssistantPageContext,
} from "@/features/assistant/types";
import type { AdminEntityKey } from "@/features/assistant/catalog/adminEntities";
import { chatWithLlm } from "./llmClient";
import { detectDirectIntent } from "./detectIntent";
import {
  parseAssistantLlmOutput,
  resolveAssistantAction,
} from "./resolveAction";
import {
  fetchDriverComplianceHints,
  fetchPageSummaryText,
  summarizeEntityById,
} from "./pageContextFetcher";
import { fetchFirstEntityId, resolveOpenFirstEntity } from "./openFirstEntity";
import { resolveAnalyticsQuery, resolveRankingQuery } from "./analyticsQueries";
import type { RankingQuery } from "./rankingIntent";
import { resolveSummarizeByQuery } from "./summarizeByQuery";
import { parseSpecialIntentToken } from "./specialIntent";
import { resolveSpecialIntent } from "./resolveSpecialIntent";

export const runtime = "nodejs";
export const maxDuration = 120;

interface AssistantRequestBody {
  messages?: AssistantChatMessage[];
  context?: AssistantPageContext;
}

async function buildSummaryResponse(
  context: AssistantPageContext,
  authHeader: string
) {
  const summary = await fetchPageSummaryText(context, authHeader);
  const hints =
    context.entity === "drivers" && context.entityId
      ? await fetchDriverComplianceHints(context.entityId, authHeader)
      : [];
  const hintBlock =
    hints.length > 0
      ? `\n\nPoints d'attention :\n${hints.map((h) => `• ${h}`).join("\n")}`
      : "";
  return {
    message: summary
      ? `${summary}${hintBlock}`
      : "Je n'ai pas pu charger les détails de cette fiche. Vérifiez que la fiche existe et que votre session est active.",
    action: null,
  };
}

export async function POST(req: NextRequest) {
  if (!process.env.LLM_BASE_URL && !process.env.LLM_MODEL) {
    return NextResponse.json(
      { message: "Assistant IA non configuré (LLM_BASE_URL manquant)." },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Authentification requise." },
      { status: 401 }
    );
  }

  let body: AssistantRequestBody;
  try {
    body = (await req.json()) as AssistantRequestBody;
  } catch {
    return NextResponse.json({ message: "Corps JSON invalide." }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim()
  );

  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { message: "Envoyez au moins un message utilisateur." },
      { status: 400 }
    );
  }

  const context = body.context;
  const recent = messages.slice(-12);
  const lastUserMessage = recent[recent.length - 1]?.content ?? "";

  try {
    const direct = await detectDirectIntent(lastUserMessage, context, authHeader);
    if (direct) {
      if (direct.message.startsWith("__ANALYTICS__:")) {
        const kind = direct.message.split(":")[1] ?? "";
        return NextResponse.json(await resolveAnalyticsQuery(kind, authHeader));
      }

      if (direct.message.startsWith("__RANKING__:")) {
        const raw = direct.message.slice("__RANKING__:".length);
        const query = JSON.parse(decodeURIComponent(raw)) as RankingQuery;
        return NextResponse.json(await resolveRankingQuery(query, authHeader));
      }

      const special = parseSpecialIntentToken(direct.message);
      if (special) {
        return NextResponse.json(await resolveSpecialIntent(special, authHeader));
      }

      if (direct.message.startsWith("__SUMMARIZE_QUERY__:")) {
        const parts = direct.message.split(":");
        const entity = parts[1] as AdminEntityKey;
        const query = decodeURIComponent(parts.slice(2).join(":"));
        return NextResponse.json(
          await resolveSummarizeByQuery(entity, query, authHeader)
        );
      }

      if (direct.message === "__SUMMARIZE__" && context?.entityId && context.entity) {
        return NextResponse.json(await buildSummaryResponse(context, authHeader));
      }

      if (direct.message === "__SUMMARIZE_FIRST__") {
        const entity: AdminEntityKey =
          context?.entity ??
          (/véhicule|vehicule/i.test(lastUserMessage) ? "vehicles" : "drivers");
        const firstId = await fetchFirstEntityId(entity, authHeader);
        if (!firstId) {
          return NextResponse.json({
            message: `Aucun ${entity === "drivers" ? "chauffeur" : entity} trouvé dans la liste.`,
            action: null,
          });
        }
        const summary = await summarizeEntityById(entity, firstId, authHeader);
        const hints =
          entity === "drivers"
            ? await fetchDriverComplianceHints(firstId, authHeader)
            : [];
        const hintBlock =
          hints.length > 0
            ? `\n\nPoints d'attention :\n${hints.map((h) => `• ${h}`).join("\n")}`
            : "";
        return NextResponse.json({
          message: summary
            ? `Premier ${entity === "drivers" ? "chauffeur" : entity} de la liste :\n\n${summary}${hintBlock}`
            : "Impossible de résumer le premier élément de la liste.",
          action: { type: "OPEN_ENTITY", entity, id: firstId },
        });
      }

      if (direct.message.startsWith("__OPEN_FIRST__:")) {
        const entity = direct.message.split(":")[1] as AdminEntityKey;
        const result = await resolveOpenFirstEntity(entity, authHeader);
        return NextResponse.json(result);
      }

      const withConfirmation = direct as typeof direct & {
        confirmation?: unknown;
      };
      if (withConfirmation.confirmation) {
        return NextResponse.json({
          message: direct.message,
          action: null,
          confirmation: withConfirmation.confirmation,
        });
      }

      const result = await resolveAssistantAction(direct, authHeader);
      return NextResponse.json(result);
    }

    const raw = await chatWithLlm(recent, context);
    const parsed = parseAssistantLlmOutput(raw);
    const result = await resolveAssistantAction(parsed, authHeader);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur assistant IA";
    return NextResponse.json({ message }, { status: 502 });
  }
}
