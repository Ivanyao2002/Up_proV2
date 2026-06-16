import type { AssistantPageContext } from "@/features/assistant/lib/assistantPageContext";
import type { AssistantConfirmation } from "@/features/assistant/types";
import { LINKS } from "@/core/api/links";
import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { assistantApiGet, record, str } from "./assistantApiClient";
import { extractDriverNameQuery } from "./driverQueryExtract";
import { resolveDriverByQuery } from "./entityResolver";

async function fetchDriverPartnerId(
  driverId: string,
  authHeader: string
): Promise<string | null> {
  const paths = [
    LINKS.v1.drivers.getById(driverId),
    LINKS.admin.v1.driverById(driverId),
  ];
  for (const path of paths) {
    const data = await assistantApiGet<Record<string, unknown>>(path, authHeader);
    if (!data) continue;
    const driver = record(data.driver) ?? data;
    const pid = driver.partner_id ?? driver.partnerId ?? data.partner_id;
    if (pid) return String(pid);
  }
  return null;
}

async function fetchAllPendingKycDocs(
  driverId: string,
  authHeader: string
): Promise<Array<{ id: string; label: string }>> {
  const data = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.kycDocuments}?subject_id=${encodeURIComponent(driverId)}&subject_type=DRIVER`,
    authHeader
  );
  return (data?.items ?? [])
    .filter((d) => {
      const s = str(d.status).toLowerCase();
      return s === "pending" || s === "submitted";
    })
    .map((d) => ({
      id: String(d.id),
      label: str(d.document_type_label ?? d.document_type_code),
    }));
}

async function fetchDriverRecord(
  driverId: string,
  authHeader: string
): Promise<Record<string, unknown> | null> {
  const detail = await assistantApiGet<Record<string, unknown>>(
    LINKS.admin.v1.driverById(driverId),
    authHeader
  );
  if (detail) return record(detail.driver) ?? detail;

  const list = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.drivers}${buildV1ListQuery({ per_page: 100, page: 1 })}`,
    authHeader
  );
  return (list?.items ?? []).find((d) => String(d.id) === driverId) ?? null;
}

function isDriverAccountPending(driver: Record<string, unknown> | null): boolean {
  if (!driver) return false;
  const approval = str(driver.approval_status ?? driver.approvalStatus).toLowerCase();
  return !["approved", "active"].includes(approval);
}

async function fetchPendingKycDoc(
  driverId: string,
  authHeader: string
): Promise<{ id: string; label: string } | null> {
  const data = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
    `${LINKS.admin.v1.kycDocuments}?subject_id=${encodeURIComponent(driverId)}&subject_type=DRIVER`,
    authHeader
  );
  const pending = (data?.items ?? []).find((d) => {
    const s = str(d.status).toLowerCase();
    return s === "pending" || s === "submitted";
  });
  if (!pending) return null;
  return {
    id: String(pending.id),
    label: str(pending.document_type_label ?? pending.document_type_code),
  };
}

function extractRechargeAmount(text: string): number | null {
  const m = text.match(/(\d[\d\s]{2,})\s*(?:fcfa|f\s*cfa|francs?)?/i);
  if (!m?.[1]) return null;
  const n = parseInt(m[1].replace(/\s/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function resolveDriverForAction(
  text: string,
  context: AssistantPageContext | undefined,
  authHeader: string
): Promise<{ driverId: string; driverLabel: string } | null> {
  if (context?.entity === "drivers" && context.entityId) {
    const named = extractDriverNameQuery(text);
    if (!named) {
      return {
        driverId: context.entityId,
        driverLabel: context.entityLabel ?? context.entityId,
      };
    }
  }

  const query = extractDriverNameQuery(text);
  if (query) {
    const resolved = await resolveDriverByQuery(query, authHeader);
    if (resolved) {
      return { driverId: resolved.id, driverLabel: resolved.label };
    }
  }

  if (context?.entity === "drivers" && context.entityId) {
    return {
      driverId: context.entityId,
      driverLabel: context.entityLabel ?? context.entityId,
    };
  }

  return null;
}

function followUpHint(text: string, current: "kyc" | "recharge" | "offline"): string {
  const hasRecharge = /recharg(er|e)/i.test(text) && extractRechargeAmount(text);
  const hasOffline = /hors ligne|offline/i.test(text);
  if (current === "kyc" && hasRecharge) {
    const amount = extractRechargeAmount(text)!;
    return `\n\nEnsuite, confirmez la recharge : « recharge ${amount.toLocaleString("fr-FR")} FCFA au chauffeur ».`;
  }
  if (current === "recharge" && hasOffline) {
    return "\n\nPour le mettre hors ligne ensuite, redemandez « mets-le hors ligne ».";
  }
  return "";
}

export async function detectConfirmIntent(
  text: string,
  context?: AssistantPageContext,
  authHeader?: string
): Promise<{ message: string; confirmation?: AssistantConfirmation } | null> {
  if (!authHeader) return null;

  const driver = await resolveDriverForAction(text, context, authHeader);

  if (/suspend(re|re le|re ce)?/i.test(text) && /chauffeur|compte|driver/i.test(text)) {
    if (!driver) return null;
    return {
      message: `Confirmez la suspension de ${driver.driverLabel}.`,
      confirmation: {
        title: "Suspendre le chauffeur",
        description:
          "Le compte sera suspendu et le chauffeur ne pourra plus recevoir de courses.",
        severity: "critical",
        executeType: "suspend_driver",
        payload: { driverId: driver.driverId },
      },
    };
  }

  if (
    /activ(er|e)|réactiv(er|e)/i.test(text) &&
    /chauffeur|compte/i.test(text) &&
    !/kyc|document/i.test(text)
  ) {
    if (!driver) return null;
    return {
      message: `Confirmez l'activation de ${driver.driverLabel}.`,
      confirmation: {
        title: "Activer le chauffeur",
        description: "Le compte sera approuvé et pourra être opérationnel.",
        severity: "warning",
        executeType: "activate_driver",
        payload: { driverId: driver.driverId },
      },
    };
  }

  if (/hors ligne|offline/i.test(text) && /chauffeur|mettre|mets/i.test(text)) {
    if (!driver) return null;
    return {
      message: `Confirmez la mise hors ligne de ${driver.driverLabel}.`,
      confirmation: {
        title: "Mettre hors ligne",
        description: "Le chauffeur ne sera plus disponible pour les courses.",
        severity: "info",
        executeType: "set_driver_offline",
        payload: { driverId: driver.driverId },
      },
    };
  }

  if (/en ligne|online/i.test(text) && /chauffeur|mettre|mets/i.test(text)) {
    if (!driver) return null;
    return {
      message: `Confirmez la mise en ligne de ${driver.driverLabel}.`,
      confirmation: {
        title: "Mettre en ligne",
        description: "Le chauffeur sera marqué disponible.",
        severity: "info",
        executeType: "set_driver_online",
        payload: { driverId: driver.driverId },
      },
    };
  }

  if (/approuv(er|e)|valid(er|e)/i.test(text) && /(tout|dossier|complet|ensemble)/i.test(text)) {
    if (!driver) {
      const q = extractDriverNameQuery(text);
      return {
        message: q
          ? `Chauffeur introuvable pour « ${q} ».`
          : "Précisez le chauffeur (nom ou ouvrez sa fiche).",
      };
    }
    const pendingDocs = await fetchAllPendingKycDocs(driver.driverId, authHeader);
    const driverRecord = await fetchDriverRecord(driver.driverId, authHeader);
    const accountPending = isDriverAccountPending(driverRecord);
    if (!pendingDocs.length && !accountPending) {
      return {
        message: `Le dossier de ${driver.driverLabel} est déjà complet (KYC + compte approuvés).`,
      };
    }
    const parts: string[] = [];
    if (pendingDocs.length) parts.push(`${pendingDocs.length} document(s) KYC`);
    if (accountPending) parts.push("compte chauffeur");
    return {
      message: `Confirmez l'approbation complète pour ${driver.driverLabel} : ${parts.join(" + ")}.`,
      confirmation: {
        title: "Approuver dossier chauffeur",
        description: "Documents KYC en attente + validation du compte.",
        severity: "warning",
        executeType: "approve_driver_full",
        payload: { driverId: driver.driverId },
      },
    };
  }

  if (
    /approuv(er|e)|valid(er|e)|activ(er|e)/i.test(text) &&
    /compte/i.test(text) &&
    !/document|kyc/i.test(text)
  ) {
    if (!driver) {
      const q = extractDriverNameQuery(text);
      return {
        message: q
          ? `Chauffeur introuvable pour « ${q} ».`
          : "Précisez le chauffeur (nom ou ouvrez sa fiche).",
      };
    }
    const pendingDocs = await fetchAllPendingKycDocs(driver.driverId, authHeader);
    if (pendingDocs.length) {
      return {
        message: `${pendingDocs.length} document(s) KYC encore en attente pour ${driver.driverLabel}. Confirmez d'abord les KYC ou demandez « approuve tout le dossier ».`,
        confirmation: {
          title: `Approuver ${pendingDocs.length} document(s) KYC`,
          description: "Les documents en attente seront validés avant le compte.",
          severity: "warning",
          executeType: "approve_all_kyc_documents",
          payload: { driverId: driver.driverId },
        },
      };
    }
    const driverRecord = await fetchDriverRecord(driver.driverId, authHeader);
    if (!isDriverAccountPending(driverRecord)) {
      return { message: `Le compte de ${driver.driverLabel} est déjà approuvé.` };
    }
    return {
      message: `Confirmez l'approbation du compte chauffeur ${driver.driverLabel}.`,
      confirmation: {
        title: "Approuver compte chauffeur",
        description: "Le compte sera validé et pourra être opérationnel.",
        severity: "warning",
        executeType: "approve_driver_kyc",
        payload: { driverId: driver.driverId },
      },
    };
  }

  if (/approuv(er|e)|valid(er|e)/i.test(text) && /kyc|document/i.test(text)) {
    if (!driver) {
      const q = extractDriverNameQuery(text);
      return {
        message: q
          ? `Chauffeur introuvable pour « ${q} ». Précisez le nom complet ou ouvrez sa fiche.`
          : "Précisez le chauffeur (nom ou ouvrez sa fiche).",
      };
    }

    const docMatch = text.match(/document\s+([a-z_]+)/i);
    if (docMatch) {
      const data = await assistantApiGet<{ items?: Record<string, unknown>[] }>(
        `${LINKS.admin.v1.kycDocuments}?subject_id=${encodeURIComponent(driver.driverId)}&subject_type=DRIVER`,
        authHeader
      );
      const doc = (data?.items ?? []).find((d) =>
        str(d.document_type_code).toLowerCase().includes(docMatch[1]!.toLowerCase())
      );
      if (doc) {
        const pending = ["pending", "submitted"].includes(str(doc.status).toLowerCase());
        if (!pending) {
          return {
            message: `Le document ${str(doc.document_type_label)} est déjà ${str(doc.status)} pour ${driver.driverLabel}.${followUpHint(text, "kyc")}`,
          };
        }
        return {
          message: `Confirmez la validation du document ${str(doc.document_type_label)} (${driver.driverLabel}).${followUpHint(text, "kyc")}`,
          confirmation: {
            title: "Approuver document KYC",
            description: "Le document sera marqué comme validé.",
            severity: "warning",
            executeType: "approve_kyc_document",
            payload: { driverId: driver.driverId, documentId: String(doc.id) },
          },
        };
      }
    }

    const pendingDocs = await fetchAllPendingKycDocs(driver.driverId, authHeader);
    const wantsAll =
      /tous(?:es)?|all|ensemble|l(?:es|')?\s*documents?/i.test(text) ||
      pendingDocs.length > 1;

    if (pendingDocs.length === 0) {
      if (/recharg(er|e)/i.test(text) && extractRechargeAmount(text)) {
        const amount = extractRechargeAmount(text)!;
        const partnerId = await fetchDriverPartnerId(driver.driverId, authHeader);
        if (partnerId) {
          return {
            message: `Tous les documents KYC sont déjà approuvés pour ${driver.driverLabel}. Confirmez la recharge de ${amount.toLocaleString("fr-FR")} FCFA.`,
            confirmation: {
              title: "Recharger le chauffeur",
              description: `${amount.toLocaleString("fr-FR")} FCFA seront crédités via le wallet partenaire.`,
              severity: "warning",
              executeType: "recharge_driver",
              payload: {
                driverId: driver.driverId,
                partnerId,
                amountFcfa: amount,
              },
            },
          };
        }
      }

      const driverRecord = await fetchDriverRecord(driver.driverId, authHeader);
      if (isDriverAccountPending(driverRecord)) {
        return {
          message: `Documents KYC OK pour ${driver.driverLabel}, mais le compte chauffeur n'est pas encore approuvé. Confirmez l'approbation du compte.`,
          confirmation: {
            title: "Approuver compte chauffeur",
            description: "Validation du compte après KYC complet.",
            severity: "warning",
            executeType: "approve_driver_kyc",
            payload: { driverId: driver.driverId },
          },
        };
      }

      return {
        message: `Tous les documents KYC sont déjà approuvés pour ${driver.driverLabel}. Aucune validation en attente.${followUpHint(text, "kyc")}`,
      };
    }

    if (wantsAll) {
      const labels = pendingDocs.map((d) => d.label).join(", ");
      return {
        message: `Confirmez la validation de ${pendingDocs.length} document(s) KYC pour ${driver.driverLabel} : ${labels}.${followUpHint(text, "kyc")}`,
        confirmation: {
          title: `Approuver ${pendingDocs.length} document(s) KYC`,
          description: "Tous les documents en attente seront validés.",
          severity: "warning",
          executeType: "approve_all_kyc_documents",
          payload: { driverId: driver.driverId },
        },
      };
    }

    const pending = pendingDocs[0]!;
    return {
      message: `Confirmez la validation du document « ${pending.label} » pour ${driver.driverLabel}.${followUpHint(text, "kyc")}`,
      confirmation: {
        title: "Approuver document KYC",
        description: "Le document sera marqué comme validé.",
        severity: "warning",
        executeType: "approve_kyc_document",
        payload: { driverId: driver.driverId, documentId: pending.id },
      },
    };
  }

  if (/rejett(er|e)|refus(er|e)/i.test(text) && /kyc|document/i.test(text)) {
    if (!driver) return null;
    const pending = await fetchPendingKycDoc(driver.driverId, authHeader);
    if (!pending) {
      return {
        message: `Aucun document KYC en attente pour ${driver.driverLabel} — rejet impossible.`,
      };
    }
    const reasonMatch = text.match(/motif\s+[«"]([^»"]+)[»"]|motif\s+(.+?)(?:\s+et|\s*$)/i);
    const reason =
      reasonMatch?.[1]?.trim() ??
      reasonMatch?.[2]?.trim() ??
      "Document non conforme";
    return {
      message: `Confirmez le rejet du document « ${pending.label} » (${driver.driverLabel}).`,
      confirmation: {
        title: "Rejeter document KYC",
        description: `Motif : ${reason}`,
        severity: "critical",
        executeType: "reject_kyc_document",
        payload: {
          driverId: driver.driverId,
          documentId: pending.id,
          rejectionReason: reason,
        },
      },
    };
  }

  if (/recharg(er|e)/i.test(text)) {
    const amount = extractRechargeAmount(text);
    if (!amount || !driver) return null;
    const partnerId = await fetchDriverPartnerId(driver.driverId, authHeader);
    if (!partnerId) return null;
    return {
      message: `Confirmez la recharge de ${amount.toLocaleString("fr-FR")} FCFA pour ${driver.driverLabel}.`,
      confirmation: {
        title: "Recharger le chauffeur",
        description: `${amount.toLocaleString("fr-FR")} FCFA seront crédités via le wallet partenaire.`,
        severity: "warning",
        executeType: "recharge_driver",
        payload: { driverId: driver.driverId, partnerId, amountFcfa: amount },
      },
    };
  }

  return null;
}

export function isSummaryRequest(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t === "resume" || t === "résumé" || t === "resumé") return true;
  return /résum|resume|synthèse|synthese|situation|état du|etat du|que sais-tu|qu'est-ce qui bloque|conforme|bloque|chauffeur actuel|fiche actuelle|peut.?il rouler|peut rouler|dossier chauffeur|wallet|solde|localisation|position live/i.test(
    text
  );
}

export function detectRelativeIntent(
  text: string,
  context?: AssistantPageContext
): { message: string; action: import("@/features/assistant/types").AssistantAction } | null {
  if (!context?.entity || !context.entityId) return null;
  const t = text.toLowerCase();

  if (context.entity === "drivers" && /son véhicule|sa voiture|son vehicule|le véhicule/i.test(t)) {
    return {
      message: "Je cherche le véhicule de ce chauffeur…",
      action: {
        type: "OPEN_RELATED",
        targetEntity: "vehicles",
        sourceEntity: "drivers",
        sourceQuery: context.entityId,
      },
    };
  }

  if (context.entity === "vehicles" && /son chauffeur|le chauffeur/i.test(t)) {
    return {
      message: "Je cherche le chauffeur de ce véhicule…",
      action: {
        type: "OPEN_RELATED",
        targetEntity: "drivers",
        sourceEntity: "vehicles",
        sourceQuery: context.entityId,
      },
    };
  }

  if (context.entity === "drivers" && /son partenaire|le partenaire/i.test(t)) {
    return {
      message: "J'ouvre le partenaire de ce chauffeur…",
      action: {
        type: "OPEN_RELATED",
        targetEntity: "partners",
        sourceEntity: "drivers",
        sourceQuery: context.entityId,
      },
    };
  }

  if (context.entity === "trips" && /le client|son client/i.test(t)) {
    return {
      message: "J'ouvre le client de cette course…",
      action: {
        type: "OPEN_RELATED",
        targetEntity: "clients",
        sourceEntity: "trips",
        sourceQuery: context.entityId,
      },
    };
  }

  return null;
}
