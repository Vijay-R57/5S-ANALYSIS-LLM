/**
 * src/modules/audit/questionScore/scoreTypes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.4 — Question Score Calculator: Types
 *
 * ROLE:
 *   Contains types and interfaces for the Question Score Calculator.
 */

import type { AuditRating, QuestionScore } from '@/types/analysis';

export type { AuditRating, QuestionScore };

/** Maps each possible AuditRating to its numeric score value (or null). */
export interface RatingScoreMapping {
  VERY_GOOD:  number;
  GOOD:       number;
  AVERAGE:    number;
  BAD:        number;
  VERY_BAD:   number;
  NOT_SCORED: null;
}
