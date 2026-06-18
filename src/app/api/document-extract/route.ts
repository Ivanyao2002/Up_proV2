import { NextRequest, NextResponse } from "next/server";
import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
  VehicleIdentitySubtype,
} from "@/features/fleet/lib/documentExtraction.types";
import { extractKycOcrGroup } from "@/features/fleet/api/kycOcr.service";

export const runtime = "nodejs";
export const maxDuration = 60;

const DOCUMENT_TYPES: ExtractionDocumentType[] = ["cni", "license", "registration"];

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const documentType = form.get("documentType") as ExtractionDocumentType | null;
  const vehicleSubtypeRaw = form.get("vehicleSubtype") as string | null;
  const vehicleSubtype = vehicleSubtypeRaw?.trim()
    ? (vehicleSubtypeRaw.trim() as VehicleIdentitySubtype)
    : null;
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!documentType || !DOCUMENT_TYPES.includes(documentType)) {
    return NextResponse.json({ message: "documentType invalide" }, { status: 400 });
  }
  if (!files.length) {
    return NextResponse.json({ message: "Aucun fichier fourni" }, { status: 400 });
  }

  try {
    const result = await extractKycOcrGroup(documentType, files, vehicleSubtype, {
      server: true,
    });

    if (result.error && !result.driver && !result.vehicle) {
      return NextResponse.json(
        { ...result, meta: { provider: "kyc-ocr" } } satisfies DocumentExtractionResult & {
          meta?: { provider: string };
        },
        {
          status: result.error.includes("illisible") ? 422 : 502,
        }
      );
    }

    return NextResponse.json({
      ...result,
      meta: { provider: "kyc-ocr" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur extraction document";
    return NextResponse.json({ message }, { status: 500 });
  }
}
