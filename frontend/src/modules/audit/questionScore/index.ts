/**
 * src/modules/audit/questionScore/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.4 — Question Score Calculator: Public API
 *
 * ROLE:
 *   Public barrel and collection orchestration for the Question Score Calculator.
 */

import type { RuleEvaluationResult, QuestionScore } from '@/types/analysis';
import { calculateQuestionScore } from './scoreCalculator';

// ── Re-exports ────────────────────────────────────────────────────────────────

export { calculateQuestionScore } from './scoreCalculator';
export { DEFAULT_SCORE_MAPPING, getScoreMapping } from './scoreMapping';
export { validateScoreInput } from './scoreValidator';
export type { RatingScoreMapping } from './scoreTypes';

// ── Collection Helper ─────────────────────────────────────────────────────────

/**
 * Calculates scores for all evaluated question ratings.
 *
 * @param ruleResults - Output of the Rule Engine (Sprint 6.3).
 * @param config      - Global audit configuration containing the score mapping.
 * @returns Array of QuestionScores.
 */
export function calculateAllQuestionScores(
  ruleResults: RuleEvaluationResult[],
  config:      any,
): QuestionScore[] {
  return ruleResults.map(result =>
    calculateQuestionScore(
      {
        questionId:      result.questionId,
        visibility:      result.visibility,
        rating:          result.rating,
        evaluationTrace: result.evaluationTrace,
      },
      config,
    ),
  );
}
