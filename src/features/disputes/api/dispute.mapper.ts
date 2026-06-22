import type { DisputeDetail } from "./dispute.types";


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
    messages: detail?.messages ?? [],
  };
}
