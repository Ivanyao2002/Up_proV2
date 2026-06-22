import { env } from "@/core/config/env";
import { LINKS } from "@/core/api/links";
import type {
  KycDocument,
  KycDocumentDisplayItem,
  KycDocumentStatus,
} from "@/shared/types";
import type { ApiAdminKycDocumentItem } from "./adminKyc.api.types";

const DOCUMENT_TYPE_MAP: Record<
  string,
  { type: KycDocument["type"]; label: string }
> = {
  NATIONAL_ID: { type: "cni", label: "Carte nationale d'identité" },
  ID_CARD: { type: "cni", label: "Carte nationale d'identité" },
  ID_CARD_FRONT: { type: "cni", label: "Pièce d'identité (recto)" },
  ID_CARD_BACK: { type: "cni", label: "Pièce d'identité (verso)" },
  CNI: { type: "cni", label: "Carte nationale d'identité" },
  DRIVER_LICENSE: { type: "license", label: "Permis de conduire" },
  DRIVER_LICENSE_FRONT: { type: "license", label: "Permis de conduire (recto)" },
  DRIVER_LICENSE_BACK: { type: "license", label: "Permis de conduire (verso)" },
  LICENSE: { type: "license", label: "Permis de conduire" },
  VEHICLE_REGISTRATION: { type: "registration", label: "Carte grise" },
  REGISTRATION: { type: "registration", label: "Carte grise" },
  REGISTRATION_CARD: { type: "registration", label: "Carte grise" },
  SELFIE: { type: "selfie", label: "Photo selfie" },
  DRIVER_SELFIE: { type: "selfie", label: "Photo selfie" },
  PROFILE_PHOTO: { type: "selfie", label: "Photo profil chauffeur" },
  INSURANCE: { type: "registration", label: "Assurance véhicule" },
  BUSINESS_REGISTRATION: { type: "registration", label: "Registre de commerce (RCC)" },
  RCCM: { type: "registration", label: "RCCM" },
};

const GROUP_LABELS: Record<string, string> = {
  ID_CARD: "Pièce d'identité",
  DRIVER_LICENSE: "Permis de conduire",
  PROFILE_PHOTO: "Photo profil chauffeur",
  REGISTRATION_CARD: "Carte grise",
  INSURANCE: "Assurance véhicule",
};

const GROUPED_DISPLAY_GROUPS = new Set(["ID_CARD", "DRIVER_LICENSE"]);

const DISPLAY_GROUP_ORDER = [
  "PROFILE_PHOTO",
  "ID_CARD",
  "DRIVER_LICENSE",
  "REGISTRATION_CARD",
  "INSURANCE",
] as const;

const EXPECTED_DRIVER_SLOTS: Array<{
  type: KycDocument["type"];
  group?: string;
  label: string;
}> = [
  { type: "cni", group: "ID_CARD", label: "Carte nationale d'identité" },
  { type: "license", group: "DRIVER_LICENSE", label: "Permis de conduire" },
  { type: "selfie", group: "PROFILE_PHOTO", label: "Photo selfie" },
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

function sideSortOrder(side?: string | null): number {
  const key = String(side ?? "").toUpperCase();
  if (key === "FRONT" || key === "SELFIE") return 0;
  if (key === "BACK") return 1;
  return 2;
}

function groupSortIndex(group?: string | null): number {
  const key = String(group ?? "").toUpperCase();
  const index = DISPLAY_GROUP_ORDER.indexOf(
    key as (typeof DISPLAY_GROUP_ORDER)[number]
  );
  return index === -1 ? DISPLAY_GROUP_ORDER.length : index;
}

function resolveGroupLabel(groupId: string, documents: KycDocument[]): string {
  const mapped = GROUP_LABELS[groupId];
  if (mapped) return mapped;
  const first = documents[0]?.label ?? "Document";
  return first.replace(/\s*\((recto|verso|selfie)\)/i, "").trim() || first;
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
    document_type_code: item.document_type_code ?? undefined,
    document_group: item.document_group ?? undefined,
    document_side: item.document_side ?? undefined,
  };
}

export function dedupeApiKycItems(
  items: ApiAdminKycDocumentItem[]
): ApiAdminKycDocumentItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/** Clé métier : un seul document actif par type (recto, verso, RCC…). */
export function resolveKycDocumentSlotKey(doc: KycDocument): string {
  const code = doc.document_type_code?.trim().toUpperCase();
  if (code) return code;
  const group = doc.document_group?.trim().toUpperCase();
  const side = doc.document_side?.trim().toUpperCase();
  if (group && side) return `${group}_${side}`;
  if (group) return group;
  return `${doc.type}_${doc.id}`;
}

function kycDocumentRecency(doc: KycDocument): number {
  const uploaded = new Date(doc.uploaded_at || 0).getTime();
  if (uploaded > 0) return uploaded;
  const reviewed = doc.reviewed_at ? new Date(doc.reviewed_at).getTime() : 0;
  return reviewed;
}

/** Conserve la version la plus récente par emplacement (évite les doublons après remplacement). */
export function dedupeKycDocumentsBySlot(documents: KycDocument[]): KycDocument[] {
  const bySlot = new Map<string, KycDocument>();

  for (const doc of documents) {
    const key = resolveKycDocumentSlotKey(doc);
    const existing = bySlot.get(key);
    if (!existing || kycDocumentRecency(doc) >= kycDocumentRecency(existing)) {
      bySlot.set(key, doc);
    }
  }

  return [...bySlot.values()].sort((a, b) => {
    const groupDiff =
      groupSortIndex(a.document_group) - groupSortIndex(b.document_group);
    if (groupDiff !== 0) return groupDiff;
    const sideDiff =
      sideSortOrder(a.document_side) - sideSortOrder(b.document_side);
    if (sideDiff !== 0) return sideDiff;
    return kycDocumentRecency(b) - kycDocumentRecency(a);
  });
}

export function mapApiKycItemsForDriver(
  items: ApiAdminKycDocumentItem[],
  driverId: string
): KycDocument[] {
  const mapped = dedupeApiKycItems(items)
    .filter(
      (item) =>
        String(item.subject_type ?? "").toUpperCase() === "DRIVER" &&
        item.subject_id === driverId
    )
    .map(mapApiKycItemToKycDocument)
    .sort((a, b) => {
      const groupDiff =
        groupSortIndex(a.document_group) - groupSortIndex(b.document_group);
      if (groupDiff !== 0) return groupDiff;
      const sideDiff =
        sideSortOrder(a.document_side) - sideSortOrder(b.document_side);
      if (sideDiff !== 0) return sideDiff;
      return (
        new Date(b.uploaded_at || 0).getTime() -
        new Date(a.uploaded_at || 0).getTime()
      );
    });
  return dedupeKycDocumentsBySlot(mapped);
}

export function mapApiKycItemsForPartner(
  items: ApiAdminKycDocumentItem[],
  partnerId: string
): KycDocument[] {
  const mapped = dedupeApiKycItems(items)
    .filter((item) => {
      const subjectType = String(item.subject_type ?? "").toUpperCase();
      return (
        (subjectType === "PARTNER" || subjectType === "PARTNER_PROFILE") &&
        item.subject_id === partnerId
      );
    })
    .map(mapApiKycItemToKycDocument)
    .sort((a, b) => {
      const groupDiff =
        groupSortIndex(a.document_group) - groupSortIndex(b.document_group);
      if (groupDiff !== 0) return groupDiff;
      const sideDiff =
        sideSortOrder(a.document_side) - sideSortOrder(b.document_side);
      if (sideDiff !== 0) return sideDiff;
      return (
        new Date(b.uploaded_at || 0).getTime() -
        new Date(a.uploaded_at || 0).getTime()
      );
    });
  return dedupeKycDocumentsBySlot(mapped);
}

/** Regroupe recto/verso (CNI, permis) pour l'affichage fiche chauffeur. */
export function organizeDriverKycDocuments(
  documents: KycDocument[] | null | undefined
): KycDocumentDisplayItem[] {
  if (!documents || !Array.isArray(documents)) {
    return [];
  }

  const grouped = new Map<string, KycDocument[]>();
  const singles: KycDocument[] = [];

  for (const doc of documents) {
    const groupId = doc.document_group?.trim().toUpperCase();
    if (groupId && GROUPED_DISPLAY_GROUPS.has(groupId)) {
      const list = grouped.get(groupId) ?? [];
      list.push(doc);
      grouped.set(groupId, list);
      continue;
    }
    singles.push(doc);
  }

  const result: KycDocumentDisplayItem[] = [];

  for (const groupId of DISPLAY_GROUP_ORDER) {
    const docs = grouped.get(groupId);
    if (!docs?.length) continue;
    docs.sort((a, b) => sideSortOrder(a.document_side) - sideSortOrder(b.document_side));
    if (docs.length === 1) {
      result.push({ kind: "single", document: docs[0] });
    } else {
      result.push({
        kind: "group",
        groupId,
        label: resolveGroupLabel(groupId, docs),
        documents: docs,
      });
    }
    grouped.delete(groupId);
  }

  for (const [groupId, docs] of grouped) {
    docs.sort((a, b) => sideSortOrder(a.document_side) - sideSortOrder(b.document_side));
    if (docs.length === 1) {
      result.push({ kind: "single", document: docs[0] });
    } else {
      result.push({
        kind: "group",
        groupId,
        label: resolveGroupLabel(groupId, docs),
        documents: docs,
      });
    }
  }

  singles.sort((a, b) => {
    const groupDiff =
      groupSortIndex(a.document_group) - groupSortIndex(b.document_group);
    if (groupDiff !== 0) return groupDiff;
    return sideSortOrder(a.document_side) - sideSortOrder(b.document_side);
  });

  for (const doc of singles) {
    result.push({ kind: "single", document: doc });
  }

  return result;
}

function hasDriverKycSlot(
  documents: KycDocument[],
  slot: (typeof EXPECTED_DRIVER_SLOTS)[number]
): boolean {
  if (slot.group) {
    return documents.some(
      (doc) =>
        doc.document_group?.toUpperCase() === slot.group ||
        doc.type === slot.type
    );
  }
  return documents.some((doc) => doc.type === slot.type);
}

/** Conserve la grille de cartes attendue (CNI, permis, selfie) pour les comptes en attente. */
export function mergeExpectedDriverKycSlots(
  documents: KycDocument[],
  options?: { showMissingSlots?: boolean }
): KycDocument[] {
  if (!options?.showMissingSlots) return documents;

  const merged = [...documents];

  for (const slot of EXPECTED_DRIVER_SLOTS) {
    if (!hasDriverKycSlot(merged, slot)) {
      merged.push({
        id: `slot-${slot.type}`,
        type: slot.type,
        label: slot.label,
        status: "pending",
        uploaded_at: "",
        reviewed_at: null,
        document_group: slot.group,
      });
    }
  }

  return merged.sort((a, b) => {
    const groupDiff =
      groupSortIndex(a.document_group) - groupSortIndex(b.document_group);
    if (groupDiff !== 0) return groupDiff;
    const sideDiff =
      sideSortOrder(a.document_side) - sideSortOrder(b.document_side);
    if (sideDiff !== 0) return sideDiff;
    const order = ["cni", "license", "selfie", "registration"] as const;
    return order.indexOf(a.type) - order.indexOf(b.type);
  });
}
