/**
 * src/modules/audit/scoreAggregation/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.5 — Score Aggregator Engine: Public API
 *
 * ROLE:
 *   Public barrel and collection entry point for the Score Aggregator Engine.
 */

export { calculatePillarScores } from './pillarCalculator';
export { calculateOverallScore } from './overallCalculator';
export { calculatePercentage }   from './percentageCalculator';
export { validateAggregationInputs } from './aggregationValidator';

export type {
  QuestionScore,
  PillarScore,
  OverallScore,
  RoundingRules,
  AggregationConfig,
} from './aggregationTypes';
