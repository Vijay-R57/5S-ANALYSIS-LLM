/**
 * src/modules/audit/scoreAggregation/percentageCalculator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.5 — Score Aggregator Engine: Percentage Calculator
 *
 * ROLE:
 *   Calculates and rounds percentages using a single configurable rounding strategy.
 */

import type { RoundingRules } from './aggregationTypes';

/**
 * Calculates a percentage score and rounds it according to the rounding rules.
 *
 * Safe against division by zero (returns 0 if max is 0).
 *
 * @param actual   - The actual score achieved.
 * @param max      - The maximum possible score.
 * @param rules    - Rounding configuration (decimals).
 */
export function calculatePercentage(
  actual: number,
  max:    number,
  rules:  RoundingRules = { decimals: 2 },
): number {
  if (max <= 0) {
    return 0;
  }

  const rawPercent = (actual / max) * 100;
  const factor     = Math.pow(10, rules.decimals);

  return Math.round(rawPercent * factor) / factor;
}
