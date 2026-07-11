/**
 * src/modules/audit/scoreAggregation/pillarCalculator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.5 — Score Aggregator Engine: Pillar Score Calculator
 *
 * ROLE:
 *   Groups QuestionScores by pillar and aggregates them into PillarScore objects.
 *   Enforces configured pillar order and excludes ineligible scores.
 */

import type { QuestionScore, PillarScore, AggregationConfig } from './aggregationTypes';
import { calculatePercentage } from './percentageCalculator';
import { validateAggregationInputs } from './aggregationValidator';
import { debugLog, debugGroup, debugGroupEnd } from '../pipeline/debug';

/**
 * Calculates aggregated scores for each pillar.
 *
 * @param questionScores - The individual question scores.
 * @param config         - Aggregation configuration (pillars, rounding rules).
 * @returns Array of PillarScores in the configured order.
 */
export function calculatePillarScores(
  questionScores: QuestionScore[],
  config:         AggregationConfig,
): PillarScore[] {
  // Validate inputs first
  validateAggregationInputs(questionScores, config);

  debugGroup('Pillar Calculator Started');

  // Map to speed up grouping
  const questionsByPillar = new Map<string, QuestionScore[]>();
  for (const pillar of config.pillars) {
    questionsByPillar.set(pillar, []);
  }

  for (const qs of questionScores) {
    const list = questionsByPillar.get(qs.pillar);
    if (list) {
      list.push(qs);
    }
  }

  const results: PillarScore[] = [];

  // Always process in the configured order
  for (const pillar of config.pillars) {
    const pQuestions = questionsByPillar.get(pillar) ?? [];

    const eligible = pQuestions.filter(q => q.scoreEligible);
    const skipped  = pQuestions.filter(q => !q.scoreEligible);

    const actualScore  = eligible.reduce((acc, q) => acc + (q.score ?? 0), 0);
    const maximumScore = eligible.reduce((acc, q) => acc + (q.maxScore ?? 0), 0);

    const percentage = calculatePercentage(actualScore, maximumScore, config.rounding);

    debugGroup(`Current Pillar: ${pillar}`);
    debugLog('Eligible Questions:', eligible.length);
    debugLog('Skipped Questions: ', skipped.length);
    debugLog('Actual Score:      ', actualScore);
    debugLog('Maximum Score:     ', maximumScore);
    debugLog('Percentage:        ', percentage);
    debugGroupEnd();

    results.push({
      pillar,
      questionCount:     pQuestions.length,
      eligibleQuestions: eligible.length,
      skippedQuestions:  skipped.length,
      actualScore,
      maximumScore,
      percentage,
    });
  }

  debugGroupEnd();

  return results;
}
