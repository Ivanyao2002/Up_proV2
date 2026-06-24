import { apiClient } from "@/core/http/apiClient";
import { LINKS, createUrl } from "@/core/api/links";
import { fetchClient } from "@/core/http/fetchClient";
import { downloadBlob } from "@/shared/lib/tableExport";
import type {
  ReportingFilters,
  ActivityFilters,
  ReportingOverview,
  ReportingActivity,
  ReportingFinance,
  ReportingQuality,
  ReportingGovernance,
  FilterOptionsResponse,
  ReportCatalogItem,
  CreateExportRequest,
  ExportJob,
  ExportListQuery,
  ExportListResponse,
} from "./reporting.types";

function buildReportingQuery(filters?: ReportingFilters | ActivityFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function exportFileName(
  contentDisposition: string | null,
  job: ExportJob
): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? `${job.report_code}.${job.format}`;
}

export const reportingService = {
  getFilterOptions: (): Promise<FilterOptionsResponse> =>
    apiClient.get(LINKS.reporting.filterOptions),

  getOverview: (filters?: ReportingFilters): Promise<ReportingOverview> =>
    apiClient.get(`${LINKS.reporting.overview}${buildReportingQuery(filters)}`),

  getActivity: (filters?: ActivityFilters): Promise<ReportingActivity> =>
    apiClient.get(`${LINKS.reporting.activity}${buildReportingQuery(filters)}`),

  getFinance: (filters?: ReportingFilters): Promise<ReportingFinance> =>
    apiClient.get(`${LINKS.reporting.finance}${buildReportingQuery(filters)}`),

  getQuality: (filters?: ReportingFilters): Promise<ReportingQuality> =>
    apiClient.get(`${LINKS.reporting.quality}${buildReportingQuery(filters)}`),

  getGovernance: (filters?: ReportingFilters): Promise<ReportingGovernance> =>
    apiClient.get(`${LINKS.reporting.governance}${buildReportingQuery(filters)}`),

  getReportCatalog: (): Promise<{ data: ReportCatalogItem[] }> =>
    apiClient.get(LINKS.reporting.reports),

  getExports: (query?: ExportListQuery): Promise<ExportListResponse> =>
    apiClient.get(createUrl(LINKS.reporting.exports.list, query as Record<string, string>)),

  getExportById: (id: string): Promise<ExportJob> =>
    apiClient.get(LINKS.reporting.exports.getById(id)),

  createExport: (body: CreateExportRequest): Promise<ExportJob> =>
    apiClient.post(LINKS.reporting.exports.create, body),

  downloadExport: async (job: ExportJob): Promise<void> => {
    const response = await fetchClient(
      LINKS.reporting.exports.download(job.id),
      {
        headers: {
          Accept:
            "text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,application/json",
        },
      }
    );

    if (!response.ok) {
      let message = `Téléchargement impossible (${response.status})`;
      try {
        const body = (await response.json()) as { message?: string };
        message = body.message ?? message;
      } catch {
        // La réponse d'erreur ne contient pas forcément du JSON.
      }
      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as { download_url?: string };
      if (!body.download_url) {
        throw new Error("Le backend n’a retourné aucun fichier.");
      }
      window.location.assign(body.download_url);
      return;
    }

    const blob = await response.blob();
    downloadBlob(
      blob,
      exportFileName(response.headers.get("content-disposition"), job)
    );
  },
};
