/**
 * Contrats API — Attributions bonus (crédits issus du moteur de bonus).
 *
 * ⚠️ Le Swagger (`GET /v1/admin/bonus-awards`, `POST /v1/admin/bonus/run-evaluation`)
 * ne déclare qu'une réponse générique `Success` — la forme ci-dessous est une
 * **hypothèse raisonnable** alignée sur les conventions v1 du projet (réponse
 * enveloppée + `snake_case`/`camelCase` tolérés, pagination `page`/`limit`).
 * À confirmer côté backend (voir le rapport d'intégration).
 *
 * Forme retenue pour bonus-awards :
 * {
 *   "status": "ok",
 *   "awards": [ ApiBonusAwardItem, ... ],   // ou "items"
 *   "pagination": { page, limit, total, totalPages }
 * }
 *
 * Forme retenue pour run-evaluation :
 * {
 *   "status": "ok",
 *   "message": "Évaluation terminée",
 *   "summary": { evaluated, awarded, skipped, total_amount_xof }
 * }
 */

export interface ApiBonusAwardItem {
  id: string;

  // Chauffeur bénéficiaire
  driver_id?: string | null;
  driverId?: string | null;
  driver_name?: string | null;
  driverName?: string | null;
  driver_phone?: string | null;
  driverPhone?: string | null;

  // Montant attribué (FCFA)
  amount_xof?: number | null;
  amountXof?: number | null;
  amount?: number | null;
  reward_xof?: number | null;

  // Période évaluée
  period?: string | null;
  period_label?: string | null;
  periodLabel?: string | null;
  period_start?: string | null;
  periodStart?: string | null;
  period_end?: string | null;
  periodEnd?: string | null;

  // Règle source
  rule_id?: string | null;
  ruleId?: string | null;
  rule_name?: string | null;
  ruleName?: string | null;

  // Éligibilité / statut
  eligible?: boolean | null;
  is_eligible?: boolean | null;
  status?: string | null;
  reason?: string | null;

  // Métrique observée (ex. nb de courses)
  metric?: string | null;
  metric_value?: number | null;
  metricValue?: number | null;
  threshold_value?: number | null;
  thresholdValue?: number | null;

  created_at?: string | null;
  createdAt?: string | null;
  awarded_at?: string | null;
  awardedAt?: string | null;
}

export interface ApiBonusAwardsListResponse {
  status?: string;
  message?: string;
  awards?: ApiBonusAwardItem[];
  items?: ApiBonusAwardItem[];
  data?: ApiBonusAwardItem[];
  pagination?: import("@/core/api/v1Pagination").ApiV1Pagination;
}

export interface ApiBonusRunEvaluationSummary {
  evaluated?: number;
  awarded?: number;
  skipped?: number;
  total_amount_xof?: number;
  totalAmountXof?: number;
}

export interface ApiBonusRunEvaluationResponse {
  status?: string;
  message?: string;
  summary?: ApiBonusRunEvaluationSummary;
}
