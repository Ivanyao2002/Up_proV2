import { buildV1ListQuery } from "@/core/api/v1Pagination";
import { fetchClient } from "@/core/http/fetchClient";
import { downloadBlob } from "@/shared/lib/tableExport";
import type { ListParams } from "@/shared/types/listParams";

function resolveFileName(
  contentDisposition: string | null,
  fallback: string
): string {
  if (!contentDisposition) return fallback;
  const utf8 = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }
  const basic = contentDisposition.match(/filename="?([^";]+)"?/i);
  return basic?.[1] ?? fallback;
}

export async function downloadComptaExport(
  endpoint: string,
  fallbackFileName: string,
  params?: ListParams
): Promise<void> {
  const qs = buildV1ListQuery(params);
  const response = await fetchClient(`${endpoint}${qs}`, {
    method: "GET",
    headers: { Accept: "text/csv,application/vnd.ms-excel,application/octet-stream,*/*" },
  });

  if (!response.ok) {
    let message = `Export impossible (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string; error?: { message?: string } };
      message = body.message ?? body.error?.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const fileName = resolveFileName(
    response.headers.get("content-disposition"),
    fallbackFileName
  );
  downloadBlob(blob, fileName);
}
