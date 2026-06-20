export type ReportingService = "taxi" | "delivery" | "freight" | "rental";
export type ExportFormat = "csv" | "xlsx";
export type ExportStatus = "queued" | "processing" | "ready" | "failed" | "expired";
export type AlertSeverity = "info" | "warning" | "critical";
export type ActivityDimension =
  | "service"
  | "country"
  | "zone"
  | "franchise"
  | "partner"
  | "driver"
  | "deliverer";

export interface ReportingFilters {
  date_from?: string;
  date_to?: string;
  timezone?: string;
  service?: ReportingService;
  country_code?: string;
  zone_id?: string;
  franchise_id?: string;
  partner_id?: string;
  group_by?: "day" | "week" | "month";
}

export interface ActivityFilters extends ReportingFilters {
  dimension?: ActivityDimension;
  page?: number;
  per_page?: number;
  sort?: "activity" | "completed" | "gmv" | "acceptance_rate" | "cancellation_rate" | "completion_rate";
  order?: "asc" | "desc";
}

export interface ReportingPeriod {
  date_from: string;
  date_to: string;
  timezone: string;
  comparison_date_from?: string;
  comparison_date_to?: string;
}

export interface ReportingScope {
  service: ReportingService | null;
  country_code: string | null;
  zone_id: string | null;
  franchise_id: string | null;
  partner_id: string | null;
}

export interface ReportingKpi {
  value: number;
  previous_value?: number;
  change_pct: number | null;
}

export interface ReportingMoneyKpi extends ReportingKpi {
  currency: string;
}

export interface ReportingBase {
  period: ReportingPeriod;
  scope: ReportingScope;
  generated_at: string;
}

export interface ActivitySeries {
  bucket: string;
  created: number;
  completed: number;
  cancelled: number;
  gmv?: number;
  currency?: string;
}

export interface ServiceBreakdown {
  service: ReportingService;
  activity: number;
  completed: number;
  gmv: number;
  currency: string;
}

export interface ReportingAlert {
  code: string;
  severity: AlertSeverity;
  label: string;
  value: number;
  threshold: number;
  dimension: {
    type: string;
    id: string;
    label: string;
  };
}

export interface OverviewKpis {
  total_activity: ReportingKpi;
  completed_activity: ReportingKpi;
  gmv: ReportingMoneyKpi;
  platform_commission: ReportingMoneyKpi;
  active_drivers: ReportingKpi;
  active_clients: ReportingKpi;
  cancellation_rate: ReportingKpi;
  complaint_rate: ReportingKpi;
}

export interface ReportingOverview extends ReportingBase {
  kpis: OverviewKpis;
  activity_series: ActivitySeries[];
  service_breakdown: ServiceBreakdown[];
  alerts: ReportingAlert[];
}

export interface ActivitySummary {
  created: number;
  accepted: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  acceptance_rate: number;
  cancellation_rate: number;
  completion_rate: number;
}

export interface ActivitySeriesItem {
  bucket: string;
  created: number;
  accepted: number;
  completed: number;
  cancelled: number;
}

export interface RankingItem {
  id: string;
  label: string;
  activity: number;
  completed: number;
  gmv: number;
  currency: string;
  acceptance_rate: number;
  cancellation_rate: number;
  completion_rate: number;
}

export interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface ActivityRanking {
  dimension: ActivityDimension;
  data: RankingItem[];
  meta: PaginationMeta;
}

export interface ReportingActivity extends ReportingBase {
  summary: ActivitySummary;
  series: ActivitySeriesItem[];
  ranking: ActivityRanking;
}

export interface FinanceSeriesItem {
  bucket: string;
  gross_revenue: number;
  platform_commission: number;
  partner_commission: number;
  franchise_commission: number;
  wallet_topups: number;
  wallet_debits: number;
}

export interface TransactionByStatus {
  status: string;
  count: number;
  amount: number;
}

export interface TransactionByPaymentMethod {
  payment_method: string;
  count: number;
  amount: number;
}

export interface CommissionBreakdownItem {
  dimension_type: string;
  dimension_id: string;
  dimension_label: string;
  gross_revenue: number;
  platform_commission: number;
  partner_commission: number;
  franchise_commission: number;
}

export interface FinanceKpis {
  gross_revenue: number;
  platform_commission: number;
  partner_commission: number;
  franchise_commission: number;
  wallet_balance: number;
  wallet_topups: number;
  wallet_debits: number;
  transactions_count: number;
}

export interface ReportingFinance extends ReportingBase {
  currency: string;
  kpis: FinanceKpis;
  series: FinanceSeriesItem[];
  transactions: {
    by_status: TransactionByStatus[];
    by_payment_method: TransactionByPaymentMethod[];
  };
  commission_breakdown: CommissionBreakdownItem[];
}

export interface QualitySeriesItem {
  bucket: string;
  incidents: number;
  complaints: number;
  resolved_complaints: number;
  average_resolution_minutes: number;
}

export interface QualityKpis {
  incidents_count: number;
  critical_incidents_count: number;
  complaints_count: number;
  complaint_rate: number;
  average_first_assignment_minutes: number;
  average_resolution_minutes: number;
  resolved_within_sla_rate: number;
}

export interface QualityRankingItem {
  dimension_type: string;
  dimension_id: string;
  dimension_label: string;
  completed_activity: number;
  incidents: number;
  complaints: number;
  complaint_rate: number;
}

export interface ReportingQuality extends ReportingBase {
  kpis: QualityKpis;
  incidents_by_severity: { severity: string; count: number }[];
  complaints_by_category: { category: string; count: number }[];
  series: QualitySeriesItem[];
  ranking: QualityRankingItem[];
}

export interface AuditEventsByCategory {
  category: string;
  count: number;
}

export interface ComplianceByEntityType {
  entity_type: string;
  checked: number;
  compliant: number;
  compliance_rate: number;
}

export interface ReportingGovernance extends ReportingBase {
  audit: {
    events_count: number;
    sensitive_events_count: number;
    failed_actions_count: number;
    events_by_category: AuditEventsByCategory[];
  };
  compliance: {
    global_rate: number;
    entities_checked: number;
    entities_compliant: number;
    documents_expired: number;
    documents_expiring_soon: number;
    by_entity_type: ComplianceByEntityType[];
  };
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptionsResponse {
  services: FilterOption[];
  countries: { code: string; name: string }[];
  zones: { id: string; name: string; country_code: string }[];
  franchises: { id: string; name: string; zone_id: string }[];
  partners: { id: string; name: string; franchise_id: string }[];
}

export interface ReportCatalogItem {
  code: string;
  label: string;
  description: string;
  formats: ExportFormat[];
  available_filters: string[];
}

export interface ExportFilters {
  date_from?: string;
  date_to?: string;
  service?: ReportingService | null;
  country_code?: string | null;
  zone_id?: string | null;
  franchise_id?: string | null;
  partner_id?: string | null;
  timezone?: string;
}

export interface CreateExportRequest {
  report_code: string;
  format: ExportFormat;
  filters: ExportFilters;
}

export interface ExportJob {
  id: string;
  report_code: string;
  report_label?: string;
  format: ExportFormat;
  status: ExportStatus;
  created_by?: { id: string; name: string };
  created_at: string;
  completed_at?: string | null;
  expires_at?: string | null;
  file_size_bytes?: number | null;
  error_message?: string | null;
}

export interface ExportListQuery {
  page?: number;
  per_page?: number;
  status?: ExportStatus;
}

export interface ExportListResponse {
  data: ExportJob[];
  meta: PaginationMeta;
}
