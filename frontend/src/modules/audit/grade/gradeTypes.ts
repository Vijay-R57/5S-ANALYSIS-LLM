/**
 * src/modules/audit/grade/gradeTypes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Grade Engine: Types
 *
 * ROLE:
 *   Internal and external types for the Grade Engine.
 */

import type { GradeResult } from '@/types/analysis';

export type { GradeResult };

/** A single grading threshold boundary. */
export interface GradeThreshold {
  /** The assigned grade label, e.g. "A+", "A", "F". */
  grade:         string;
  /** The minimum percentage threshold (inclusive, e.g. 90). */
  minPercentage: number;
  /** The maximum percentage threshold (inclusive, e.g. 100). */
  maxPercentage: number;
}

/** Complete grading configuration loaded from AuditRegistry. */
export interface GradingConfig {
  /** The grading configuration version. */
  version:    string;
  /** List of grading thresholds in descending or ascending order. */
  thresholds: GradeThreshold[];
}
