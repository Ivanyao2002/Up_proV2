import { NextRequest, NextResponse } from "next/server";
import type {
  DocumentExtractionResult,
  ExtractionDocumentType,
} from "@/features/fleet/lib/documentExtraction.types";

export const runtime = "nodejs";
export const maxDuration = 60;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

const PROMPTS: Record<ExtractionDocumentType, string> = {
  cni: `Tu analyses une carte nationale d'identité (Côte d'Ivoire ou Afrique de l'Ouest). Les images peuvent être recto, verso, ou les deux.
Extrais UNIQUEMENT un objet JSON valide (sans markdown) avec cette structure :
{
  "driver": {
    "first_name": "string ou null",
    "last_name": "string ou null",
    "document_number": "string ou null",
    "confidence": 0.0 à 1.0
  },
  "warnings": ["string"]
}
Si un champ est illisible, mets null et ajoute un warning.`,

  license: `Tu analyses un permis de conduire (recto et/ou verso).
Extrais UNIQUEMENT un objet JSON valide :
{
  "driver": {
    "first_name": "string ou null",
    "last_name": "string ou null",
    "document_number": "string ou null",
    "confidence": 0.0 à 1.0
  },
  "warnings": ["string"]
}`,

  registration: `Tu analyses une carte grise / certificat d'immatriculation véhicule.
Extrais UNIQUEMENT un objet JSON valide :
{
  "vehicle": {
    "plate": "string ou null",
    "brand": "string ou null",
    "model": "string ou null",
    "year": number ou null,
    "color": "string ou null",
    "confidence": 0.0 à 1.0
  },
  "warnings": ["string"]
}`,
};

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function parseJsonFromContent(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "Extraction IA non configurée (OPENROUTER_API_KEY manquant sur le serveur).",
      },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const documentType = form.get("documentType") as ExtractionDocumentType | null;
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!documentType || !PROMPTS[documentType]) {
    return NextResponse.json({ message: "documentType invalide" }, { status: 400 });
  }
  if (!files.length) {
    return NextResponse.json({ message: "Aucun fichier fourni" }, { status: 400 });
  }

  const imageParts = await Promise.all(
    files.map(async (file) => ({
      type: "image_url" as const,
      image_url: { url: await fileToDataUrl(file) },
    }))
  );

  const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "UpJunoo Pro",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPTS[documentType] },
            ...imageParts,
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { message: `OpenRouter: ${response.status} — ${errText.slice(0, 200)}` },
      { status: 502 }
    );
  }

  const completion = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = completion.choices?.[0]?.message?.content ?? "";
  const parsed = parseJsonFromContent(content);

  if (!parsed) {
    return NextResponse.json(
      {
        documentType,
        error: "Réponse IA non interprétable",
        warnings: ["Format JSON invalide — saisissez les champs manuellement."],
      } satisfies DocumentExtractionResult,
      { status: 422 }
    );
  }

  const result: DocumentExtractionResult = {
    documentType,
    driver: (parsed.driver as DocumentExtractionResult["driver"]) ?? null,
    vehicle: (parsed.vehicle as DocumentExtractionResult["vehicle"]) ?? null,
    warnings: Array.isArray(parsed.warnings)
      ? (parsed.warnings as string[])
      : [],
    error: null,
  };

  return NextResponse.json(result);
}
