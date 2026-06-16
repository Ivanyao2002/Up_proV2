import type { KycDocument } from "@/shared/types";

/** Un document peut être validé/rejeté dès qu'il est soumis et encore en attente. */
export function canReviewKycDocument(
  document: Pick<KycDocument, "status" | "uploaded_at" | "id">
): boolean {
  return (
    document.status === "pending" &&
    Boolean(document.uploaded_at) &&
    !document.id.startsWith("slot-")
  );
}
