import { env } from "@/core/config/env";
import { LINKS } from "@/core/api/links";
import type { KycDocument, KycDocumentStatus } from "@/shared/types";
import type { ApiAdminKycDocumentItem } from "./adminKyc.api.types";

const DOCUMENT_TYPE_MAP: Record<
  string,
  { type: KycDocument["type"]; label: string }
> = {
  NATIONAL_ID: { type: "cni", label: "Carte nationale d'identité" },
  ID_CARD: { type: "cni", label: "Carte nationale d'identité" },
  CNI: { type: "cni", label: "Carte nationale d'identité" },
  DRIVER_LICENSE: { type: "license", label: "Permis de conduire" },
  LICENSE: { type: "license", label: "Permis de conduire" },
  VEHICLE_REGISTRATION: { type: "registration", label: "Carte grise" },
  REGISTRATION: { type: "registration", label: "Carte grise" },
  REGISTRATION_CARD: { type: "registration", label: "Carte grise" },
  SELFIE: { type: "selfie", label: "Photo selfie" },
  DRIVER_SELFIE: { type: "selfie", label: "Photo selfie" },
  PROFILE_PHOTO: { type: "selfie", label: "Photo profil chauffeur" },
  INSURANCE: { type: "registration", label: "Assurance véhicule" },
};

const EXPECTED_DRIVER_SLOTS: Array<{
  type: KycDocument["type"];
  label: string;
}> = [
  { type: "cni", label: "Carte nationale d'identité" },
  { type: "license", label: "Permis de conduire" },
  { type: "selfie", label: "Photo selfie" },
];

function mapKycStatus(status?: string | null): KycDocumentStatus {
  const key = String(status ?? "pending").toLowerCase();
  if (key === "approved") return "approved";
  if (key === "rejected") return "rejected";
  return "pending";
}

function resolveDocumentMeta(
  code?: string | null,
  apiLabel?: string | null
): {
  type: KycDocument["type"];
  label: string;
} {
  const key = String(code ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  const mapped = DOCUMENT_TYPE_MAP[key];
  const label =
    apiLabel?.trim() ||
    mapped?.label ||
    (code ? code.replace(/_/g, " ").toLowerCase() : "Document");
  const type = mapped?.type ?? "cni";
  return { type, label };
}

/** Chemin relatif API → URL absolue ; fallback GET /v1/files/:id si besoin. */
export function resolveKycFileUrl(
  fileUrl?: string | null,
  fileUrls?: string[],
  fileDownloadUrl?: string | null,
  fileId?: string | null
): string | undefined {
  const download = fileDownloadUrl?.trim();
  if (download && /^https?:\/\//i.test(download)) return download;

  const raw = fileUrl ?? fileUrls?.[0];
  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = env.apiUrl.replace(/\/$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${base}${path}`;
  }

  if (fileId?.trim()) {
    const base = env.apiUrl.replace(/\/$/, "");
    return `${base}${LINKS.v1.files.getById(fileId.trim())}`;
  }

  return undefined;
}

export function mapApiKycItemToKycDocument(
  item: ApiAdminKycDocumentItem
): KycDocument {
  const { type, label } = resolveDocumentMeta(
    item.document_type_code,
    item.document_type_label
  );
  const previewUrl = resolveKycFileUrl(
    item.file_url,
    item.file_urls,
    item.file_download_url,
    item.file_id
  );

  return {
    id: item.id,
    type,
    label,
    status: mapKycStatus(item.status),
    status_note: item.rejection_reason ?? undefined,
    uploaded_at:
      item.uploaded_at ?? item.submitted_at ?? item.created_at ?? "",
    reviewed_at: item.reviewed_at ?? null,
    preview_url: previewUrl,
  };
}

export function mapApiKycItemsForDriver(
  items: ApiAdminKycDocumentItem[],
  driverId: string
): KycDocument[] {
  return items
    .filter(
      (item) =>
        String(item.subject_type ?? "").toUpperCase() === "DRIVER" &&
        item.subject_id === driverId
    )
    .map(mapApiKycItemToKycDocument)
    .sort(
      (a, b) =>
        new Date(b.uploaded_at || 0).getTime() -
        new Date(a.uploaded_at || 0).getTime()
    );
}

/** Conserve la grille de cartes attendue (CNI, permis, selfie) pour les comptes en attente. */
export function mergeExpectedDriverKycSlots(
  documents: KycDocument[],
  options?: { showMissingSlots?: boolean }
): KycDocument[] {
  if (!options?.showMissingSlots) return documents;

  const byType = new Map(documents.map((doc) => [doc.type, doc]));
  const merged = [...documents];

  for (const slot of EXPECTED_DRIVER_SLOTS) {
    if (!byType.has(slot.type)) {
      merged.push({
        id: `slot-${slot.type}`,
        type: slot.type,
        label: slot.label,
        status: "pending",
        uploaded_at: "",
        reviewed_at: null,
      });
    }
  }

  const order = ["cni", "license", "selfie", "registration"] as const;
  return merged.sort(
    (a, b) => order.indexOf(a.type) - order.indexOf(b.type)
  );
}
