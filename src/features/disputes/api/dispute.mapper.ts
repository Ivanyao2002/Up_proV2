import type { Dispute, DisputeCategory, DisputeDetail, DisputeStatus } from "./dispute.types";


const DISPUTE_CATEGORIES: readonly DisputeCategory[] = [
  "payment",
  "behavior",
  "service",
  "logistics",
  "app",
  "other",
];

const DISPUTE_STATUSES: readonly DisputeStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
  "escalated",
];

export function normalizeDisputeCategory(raw: unknown): DisputeCategory {
  const key = String(raw ?? "").toLowerCase();
  return (DISPUTE_CATEGORIES as readonly string[]).includes(key)
    ? (key as DisputeCategory)
    : "other";
}

export function normalizeDisputeStatus(raw: unknown): DisputeStatus {
  const key = String(raw ?? "").toLowerCase();
  return (DISPUTE_STATUSES as readonly string[]).includes(key)
    ? (key as DisputeStatus)
    : "open";
}

/** Normalise un litige (élément de liste) — catégorie/statut au vocabulaire canonique. */
export function mapDispute<T extends Partial<Dispute>>(raw: T): T {
  return {
    ...raw,
    category: normalizeDisputeCategory((raw as Partial<Dispute>).category),
    status:   normalizeDisputeStatus((raw as Partial<Dispute>).status),
  };
}

export function mapDisputeDetail(raw: unknown, id?: string): DisputeDetail {
  const root = raw as {
    dispute?: unknown;
    data?: unknown;
  } & Partial<DisputeDetail>;

  const payload = root?.dispute ?? root?.data ?? root;

  const detail = Array.isArray(payload)
    ? ((payload as DisputeDetail[]).find((d) => d.id === id) ?? (payload[0] as DisputeDetail))
    : (payload as DisputeDetail);

  return {
    ...detail,
    category: normalizeDisputeCategory(detail?.category),
    status:   normalizeDisputeStatus(detail?.status),
    messages: detail?.messages ?? [],
  };
}
