/** GET /v1/dispatch/{serviceType}/{orderId}/logs */

export interface ApiDispatchLogItem {
  id?: string;
  service_type?: string;
  serviceType?: string;
  event_type?: string;
  eventType?: string;
  action?: string;
  code?: string;
  level?: string;
  message?: string;
  detail?: string;
  details?: unknown;
  metadata?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  driver_id?: string;
  driverId?: string;
  created_at?: string;
  createdAt?: string;
  recorded_at?: string;
  recordedAt?: string;
}

export interface ApiDispatchLogsResponse {
  status?: string;
  logs?: ApiDispatchLogItem[];
  items?: ApiDispatchLogItem[];
  data?: ApiDispatchLogItem[];
}
