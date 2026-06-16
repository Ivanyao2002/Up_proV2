export type DocumentExtractProvider = "openrouter" | "paddle" | "rules";

const PROVIDERS: DocumentExtractProvider[] = ["openrouter", "paddle", "rules"];

export function resolveDocumentExtractProvider(
  override?: string | null
): DocumentExtractProvider {
  const raw = (override ?? process.env.DOCUMENT_EXTRACT_PROVIDER ?? "openrouter")
    .trim()
    .toLowerCase();
  if (PROVIDERS.includes(raw as DocumentExtractProvider)) {
    return raw as DocumentExtractProvider;
  }
  return "openrouter";
}

export function getPaddleOcrBaseUrl(): string {
  return (
    process.env.PADDLE_OCR_BASE_URL?.trim() || "http://194.29.101.141:8866"
  ).replace(/\/$/, "");
}

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || "google/gemini-2.5-flash";
}

export function getOpenRouterStructureModel(): string {
  return (
    process.env.OPENROUTER_STRUCTURE_MODEL?.trim() || getOpenRouterModel()
  );
}
