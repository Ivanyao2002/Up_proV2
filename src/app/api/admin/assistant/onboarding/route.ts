import { NextRequest, NextResponse } from "next/server";
import type { ExtractionDocumentType } from "@/features/fleet/lib/documentExtraction.types";
import { mergeExtractionResults } from "@/features/fleet/lib/mergeExtractionResults";
import {
  EMPTY_RECTO_VERSO,
  wizardFilesForExtraction,
  type RectoVersoFiles,
} from "@/shared/types/documentUpload";
import { resolveDocumentExtractProvider } from "@/app/api/document-extract/config";
import { runDocumentExtraction } from "@/app/api/document-extract/extractProviders";
import { runPaddleOcrOnFile } from "@/app/api/document-extract/paddleOcrClient";
import {
  assignSlots,
  classifyDocumentFromText,
  type DocumentSlotKey,
} from "./classifyDocument";
import { randomUUID } from "crypto";
import { searchEntityMatches, getItemId } from "../entityResolver";

function detectMissingDocuments(documents: WizardDocumentsState): string[] {
  const missing: string[] = [];
  if (!documents.cni.recto) missing.push("CNI recto");
  if (!documents.cni.verso) missing.push("CNI verso");
  if (!documents.license.recto) missing.push("Permis recto");
  if (!documents.license.verso) missing.push("Permis verso");
  if (!documents.registration.recto) missing.push("Carte grise");
  return missing;
}

async function resolvePartnerId(
  query: string,
  authHeader: string
): Promise<{ id?: string; name?: string; error?: string }> {
  const q = query.trim();
  if (!q) return {};
  if (/^[0-9a-f-]{8,}$/i.test(q)) return { id: q };

  const matches = await searchEntityMatches("partners", q, authHeader);
  if (matches.length === 0) {
    return { error: `Aucun partenaire trouvé pour « ${q} ».` };
  }
  if (matches.length > 1) {
    return {
      error: `${matches.length} partenaires correspondent — précisez le nom.`,
    };
  }
  const item = matches[0]!;
  const name = String(item.name ?? item.trade_name ?? q);
  return { id: getItemId(item), name };
}

export const runtime = "nodejs";
export const maxDuration = 180;

interface WizardDocumentsState {
  cni: RectoVersoFiles;
  license: RectoVersoFiles;
  registration: RectoVersoFiles;
  selfie: File | null;
  insurance: File | null;
  technicalInspection: File | null;
}

const EMPTY_WIZARD_DOCUMENTS: WizardDocumentsState = {
  cni: { ...EMPTY_RECTO_VERSO },
  license: { ...EMPTY_RECTO_VERSO },
  registration: { ...EMPTY_RECTO_VERSO },
  selfie: null,
  insurance: null,
  technicalInspection: null,
};

function setSlot(
  documents: WizardDocumentsState,
  slot: DocumentSlotKey,
  file: File
): WizardDocumentsState {
  const next = { ...documents };
  const [group, side] = slot.split(".") as [keyof WizardDocumentsState, string?];

  if (group === "selfie") {
    next.selfie = file;
    return next;
  }
  if (group === "insurance") {
    next.insurance = file;
    return next;
  }
  if (group === "technicalInspection") {
    next.technicalInspection = file;
    return next;
  }

  if (group === "cni" || group === "license" || group === "registration") {
    const rv = { ...(next[group] as RectoVersoFiles) };
    if (side === "verso") rv.verso = file;
    else rv.recto = file;
    return { ...next, [group]: rv };
  }

  return next;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const partnerQuery =
    (form.get("partnerQuery") as string | null)?.trim() ||
    (form.get("partnerId") as string | null)?.trim() ||
    undefined;

  if (!files.length) {
    return NextResponse.json({ message: "Ajoutez au moins une image." }, { status: 400 });
  }

  const provider = resolveDocumentExtractProvider(
    (form.get("provider") as string | null) ?? process.env.DOCUMENT_EXTRACT_PROVIDER
  );
  const apiKey = process.env.OPENROUTER_API_KEY ?? "";

  if (provider === "openrouter" && !apiKey) {
    return NextResponse.json(
      { message: "OPENROUTER_API_KEY manquant ou utilisez DOCUMENT_EXTRACT_PROVIDER=rules." },
      { status: 503 }
    );
  }

  try {
    let partnerId: string | undefined;
    let partnerName: string | undefined;
    if (partnerQuery) {
      const resolved = await resolvePartnerId(partnerQuery, authHeader);
      if (resolved.error) {
        return NextResponse.json({ message: resolved.error }, { status: 400 });
      }
      partnerId = resolved.id;
      partnerName = resolved.name;
    }

    const classifications = await Promise.all(
      files.map(async (file, index) => {
        let ocrText = "";
        try {
          ocrText = await runPaddleOcrOnFile(file);
        } catch {
          ocrText = "";
        }
        return {
          index,
          fileName: file.name,
          classification: classifyDocumentFromText(ocrText),
        };
      })
    );

    const assignments = assignSlots(
      classifications.map(({ index, classification }) => ({ index, classification }))
    );

    let documents: WizardDocumentsState = {
      ...EMPTY_WIZARD_DOCUMENTS,
      cni: { ...EMPTY_WIZARD_DOCUMENTS.cni },
      license: { ...EMPTY_WIZARD_DOCUMENTS.license },
      registration: { ...EMPTY_WIZARD_DOCUMENTS.registration },
    };

    const summary: string[] = [];
    for (const a of assignments) {
      documents = setSlot(documents, a.slot, files[a.index]!);
      summary.push(`${files[a.index]!.name} → ${a.label}`);
    }

    const unassigned = classifications.filter(
      (c) => !assignments.some((a) => a.index === c.index)
    );
    for (const u of unassigned) {
      summary.push(`${u.fileName} → non classé (${u.classification.label})`);
    }

    const extractionGroups = wizardFilesForExtraction({
      cni: documents.cni,
      license: documents.license,
      registration: documents.registration,
    });

    const extractionResults = await Promise.all(
      extractionGroups.map((group) =>
        runDocumentExtraction(provider, apiKey, group.type as ExtractionDocumentType, group.files)
      )
    );

    const merged = mergeExtractionResults(extractionResults);
    const missingDocuments = detectMissingDocuments(documents);

    const id = randomUUID();

    return NextResponse.json({
      id,
      partnerId,
      partnerName,
      merged,
      assignments: assignments.map((a) => ({
        fileIndex: a.index,
        fileName: files[a.index]!.name,
        slot: a.slot,
        label: a.label,
      })),
      summary,
      warnings: merged.warnings,
      missingDocuments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur onboarding";
    return NextResponse.json({ message }, { status: 502 });
  }
}
