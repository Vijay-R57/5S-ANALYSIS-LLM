/**
 * src/modules/audit/scoreAggregation/overallCalculator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.5 — Score Aggregator Engine: Overall Score Calculator
 *
 * ROLE:
 *   Aggregates PillarScores into one OverallScore object.
 */

import type { PillarScore, OverallScore, AggregationConfig } from './aggregationTypes';
import { calculatePercentage } from './percentageCalculator';
import { debugLog, debugGroup, debugGroupEnd } from '../pipeline/debug';

/**
 * Calculates the overall audit score by aggregating pillar scores.
 *
 * @param pillarScores - The calculated pillar scores.
 * @param config       - Aggregation configuration (rounding rules).
 * @returns Immutable OverallScore object.
 */
export function calculateOverallScore(
  pillarScores: PillarScore[],
  config:       AggregationConfig,
): OverallScore {
  const startTime = Date.now();

  debugGroup('Overall Calculator Started');

  const actualScore        = pillarScores.reduce((acc, p) => acc + p.actualScore, 0);
  const maximumScore       = pillarScores.reduce((acc, p) => acc + p.maximumScore, 0);
  const evaluatedQuestions = pillarScores.reduce((acc, p) => acc + p.eligibleQuestions, 0);
  const skippedQuestions   = pillarScores.reduce((acc, p) => acc + p.skippedQuestions, 0);
  const evaluatedPillars   = pillarScores.filter(p => p.questionCount > 0).length;

  const percentage = calculatePercentage(actualScore, maximumScore, config.rounding);

  debugLog('Overall Score:     ', `${actualScore} / ${maximumScore}`);
  debugLog('Overall Percentage:', percentage);

  const elapsed = Date.now() - startTime;
  debugLog('Execution Time:    ', `${elapsed}ms`);
  debugLog('Pipeline Decision:  PASS_TO_GRADE_ENGINE');
  debugGroupEnd();

  return {
    actualScore,
    maximumScore,
    percentage,
    evaluatedQuestions,
    skippedQuestions,
    evaluatedPillars,
  };
}
