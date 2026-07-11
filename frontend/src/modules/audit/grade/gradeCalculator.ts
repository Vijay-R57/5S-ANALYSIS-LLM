/**
 * src/modules/audit/grade/gradeCalculator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Grade Engine: Calculator
 *
 * ROLE:
 *   Converts an overall audit percentage score to a letter grade based on
 *   grading configuration. Fails on invalid ranges or unmapped scores.
 */

import type { GradeResult, GradingConfig, GradeThreshold } from './gradeTypes';
import { validateGradingConfig } from './gradeValidator';

/** Default grading scale used when no scale is defined in the configuration. */
export const DEFAULT_GRADING_CONFIG: GradingConfig = {
  version: '1.0',
  thresholds: [
    { grade: 'A+', minPercentage: 90.00, maxPercentage: 100.00 },
    { grade: 'A',  minPercentage: 80.00, maxPercentage: 89.99 },
    { grade: 'B',  minPercentage: 70.00, maxPercentage: 79.99 },
    { grade: 'C',  minPercentage: 60.00, maxPercentage: 69.99 },
    { grade: 'D',  minPercentage: 50.00, maxPercentage: 59.99 },
    { grade: 'F',  minPercentage: 0.00,  maxPercentage: 49.99 },
  ],
};

/**
 * Extracts the grading configuration from the global registry config.
 * Falls back to DEFAULT_GRADING_CONFIG if not present.
 */
export function getGradingConfig(config: any): GradingConfig {
  if (config && typeof config === 'object' && 'gradingConfig' in config && config.gradingConfig) {
    return config.gradingConfig;
  }
  return DEFAULT_GRADING_CONFIG;
}

/**
 * Determines the audit grade based on the overall percentage.
 *
 * @param overallPercentage - The aggregated rounded percentage (0-100).
 * @param config            - Global audit config containing grading boundaries.
 * @returns GradeResult object.
 */
export function calculateGrade(
  overallPercentage: number,
  config:            any,
): GradeResult {
  // 1. Load configuration and validate
  const gradingConfig = getGradingConfig(config);
  validateGradingConfig(gradingConfig);

  // 2. Input validation bounds
  if (typeof overallPercentage !== 'number' || isNaN(overallPercentage)) {
    throw new Error('INPUT_ERROR: Overall percentage must be a number.');
  }

  if (overallPercentage < 0 || overallPercentage > 100) {
    throw new Error('INPUT_ERROR: Overall percentage must be between 0 and 100.');
  }

  // 3. Find matching threshold
  let matched: GradeThreshold | null = null;
  for (const t of gradingConfig.thresholds) {
    if (overallPercentage >= t.minPercentage && overallPercentage <= t.maxPercentage) {
      matched = t;
      break;
    }
  }

  // 4. Handle no match (Return structured error)
  if (!matched) {
    throw new Error(
      `GRADING_ERROR: No grading threshold boundary matches the calculated overall ` +
      `percentage: ${overallPercentage}%. Grading configuration version: "${gradingConfig.version}".`,
    );
  }

  return {
    overallPercentage,
    grade:            matched.grade,
    matchedThreshold: `${matched.minPercentage}-${matched.maxPercentage}`,
    gradingVersion:    gradingConfig.version,
  };
}
