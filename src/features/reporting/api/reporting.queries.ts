import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportingService } from "./reporting.service";
import type {
  ReportingFilters,
  ActivityFilters,
  CreateExportRequest,
  ExportJob,
  ExportListQuery,
} from "./reporting.types";

export const reportingKeys = {
  all: ["reporting"] as const,
  filterOptions: () => [...reportingKeys.all, "filter-options"] as const,
  overview: (filters?: ReportingFilters) => [...reportingKeys.all, "overview", filters] as const,
  activity: (filters?: ActivityFilters) => [...reportingKeys.all, "activity", filters] as const,
  finance: (filters?: ReportingFilters) => [...reportingKeys.all, "finance", filters] as const,
  quality: (filters?: ReportingFilters) => [...reportingKeys.all, "quality", filters] as const,
  governance: (filters?: ReportingFilters) => [...reportingKeys.all, "governance", filters] as const,
  reports: () => [...reportingKeys.all, "reports"] as const,
  exports: {
    list: (query?: ExportListQuery) => [...reportingKeys.all, "exports", query] as const,
    detail: (id: string) => [...reportingKeys.all, "exports", id] as const,
  },
};

export function useReportingFilterOptions() {
  return useQuery({
    queryKey: reportingKeys.filterOptions(),
    queryFn: () => reportingService.getFilterOptions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useReportingOverview(filters?: ReportingFilters) {
  return useQuery({
    queryKey: reportingKeys.overview(filters),
    queryFn: () => reportingService.getOverview(filters),
  });
}

export function useReportingActivity(filters?: ActivityFilters) {
  return useQuery({
    queryKey: reportingKeys.activity(filters),
    queryFn: () => reportingService.getActivity(filters),
  });
}

export function useReportingFinance(filters?: ReportingFilters) {
  return useQuery({
    queryKey: reportingKeys.finance(filters),
    queryFn: () => reportingService.getFinance(filters),
  });
}

export function useReportingQuality(filters?: ReportingFilters) {
  return useQuery({
    queryKey: reportingKeys.quality(filters),
    queryFn: () => reportingService.getQuality(filters),
  });
}

export function useReportingGovernance(filters?: ReportingFilters) {
  return useQuery({
    queryKey: reportingKeys.governance(filters),
    queryFn: () => reportingService.getGovernance(filters),
  });
}

export function useReportCatalog() {
  return useQuery({
    queryKey: reportingKeys.reports(),
    queryFn: () => reportingService.getReportCatalog(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExports(query?: ExportListQuery) {
  return useQuery({
    queryKey: reportingKeys.exports.list(query),
    queryFn: () => reportingService.getExports(query),
    refetchInterval: (result) =>
      result.state.data?.data.some(
        (job) => job.status === "queued" || job.status === "processing"
      )
        ? 3000
        : false,
  });
}

export function useExportById(id: string, enabled = true) {
  return useQuery({
    queryKey: reportingKeys.exports.detail(id),
    queryFn: () => reportingService.getExportById(id),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "processing" ? 3000 : false;
    },
  });
}

export function useCreateExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExportRequest) => reportingService.createExport(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportingKeys.exports.list() });
    },
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: (job: ExportJob) => reportingService.downloadExport(job),
  });
}
