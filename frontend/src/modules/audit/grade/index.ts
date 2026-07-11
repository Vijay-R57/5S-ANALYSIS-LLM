/**
 * src/modules/audit/grade/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Grade Engine: Public API
 *
 * ROLE:
 *   Public barrel for the Grade Engine.
 */

export { calculateGrade, DEFAULT_GRADING_CONFIG, getGradingConfig } from './gradeCalculator';
export { validateGradingConfig } from './gradeValidator';

export type {
  GradeResult,
  GradeThreshold,
  GradingConfig,
} from './gradeTypes';
