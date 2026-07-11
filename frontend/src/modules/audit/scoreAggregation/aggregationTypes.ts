/**
 * src/modules/audit/scoreAggregation/aggregationTypes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.5 — Score Aggregator Engine: Types
 *
 * ROLE:
 *   Internal and external types for score aggregation.
 */

import type {
  QuestionScore,
  PillarScore,
  OverallScore,
} from '@/types/analysis';

export type { QuestionScore, PillarScore, OverallScore };

/** Configurable rounding rules. */
export interface RoundingRules {
  /** Number of decimal places to round percentages to (e.g. 2). */
  decimals: number;
}

/** Complete configuration for aggregation, loaded from AuditRegistry. */
export interface AggregationConfig {
  /** The list of pillars in their configured execution order. */
  pillars: string[];
  /** Rules for rounding percentages. */
  rounding: RoundingRules;
}
