/**
 * src/modules/audit/questionScore/scoreCalculator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.4 — Question Score Calculator: Calculator Logic
 *
 * ROLE:
 *   Converts deterministic ratings into deterministic numeric scores.
 *   Pure function. Fills in score, maxScore, and scoreEligible immutably.
 */

import type { QuestionScore, RatingScoreMapping } from './scoreTypes';
import { getScoreMapping } from './scoreMapping';
import { validateScoreInput } from './scoreValidator';
import { debugLog, debugGroup, debugGroupEnd } from '../pipeline/debug';

/**
 * Calculates the score for a single question based on its rating and config mapping.
 *
 * @param input  - Rating, visibility, questionId, and trace from the Rule Engine.
 * @param config - The global audit configuration containing the score mapping.
 * @returns QuestionScore output object.
 */
export function calculateQuestionScore(
  input: {
    questionId:      string;
    visibility:      string;
    rating:          any;
    evaluationTrace: string[];
  },
  config: any,
): QuestionScore {
  const startTime = Date.now();

  // 1. Load the score mapping from configuration dynamically
  const mapping = getScoreMapping(config);

  // 2. Validate input and mapping config
  validateScoreInput(input.rating, mapping);

  // 3. Compute score and max score
  const isNotScored = input.rating === 'NOT_SCORED';

  // Compute maximum score dynamically from mapping
  const maxScoreVal = isNotScored
    ? null
    : Math.max(...Object.values(mapping).filter((v): v is number => typeof v === 'number'));

  const score = isNotScored ? null : (mapping[input.rating as keyof RatingScoreMapping] as number);
  const maxScore = isNotScored ? null : maxScoreVal;
  const scoreEligible = !isNotScored;

  const elapsed = Date.now() - startTime;

  // 4. Debug Logging
  debugGroup('Question Score Calculator Started');
  debugLog('Question ID:         ', input.questionId);
  debugLog('Rating:              ', input.rating);
  debugLog('Global Score Mapping:', mapping);
  debugLog('Assigned Score:      ', score);
  debugLog('Maximum Score:       ', maxScore);
  debugLog('Score Eligibility:   ', scoreEligible);
  debugLog('Execution Time:      ', `${elapsed}ms`);
  debugLog('Pipeline Decision:    PASS_TO_PILLAR_SCORE_CALCULATOR');
  debugGroupEnd();

  // Return immutable result
  return {
    questionId:      input.questionId,
    visibility:      input.visibility,
    rating:          input.rating,
    score,
    maxScore,
    scoreEligible,
    evaluationTrace: [...input.evaluationTrace], // immutable copy of trace
  };
}
