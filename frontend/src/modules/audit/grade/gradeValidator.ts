/**
 * src/modules/audit/grade/gradeValidator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Grade Engine: Validator
 *
 * ROLE:
 *   Validates the grading configuration schema and parameters.
 *   Throws structured errors on invalid or corrupt grading configurations.
 */

import type { GradingConfig, GradeThreshold } from './gradeTypes';

/**
 * Validates a grading configuration object.
 * Throws an Error if any schema check fails.
 *
 * @param config - The grading configuration to validate.
 */
export function validateGradingConfig(config: GradingConfig): void {
  // 1. Validate top-level object
  if (!config || typeof config !== 'object') {
    throw new Error('CONFIG_ERROR: Grading configuration is missing or invalid.');
  }

  // 2. Validate version
  if (!config.version || typeof config.version !== 'string' || config.version.trim() === '') {
    throw new Error('CONFIG_ERROR: Grading configuration version is missing or empty.');
  }

  // 3. Validate thresholds existence
  if (!Array.isArray(config.thresholds) || config.thresholds.length === 0) {
    throw new Error('CONFIG_ERROR: Grading thresholds are missing or empty.');
  }

  // 4. Validate individual thresholds
  for (let i = 0; i < config.thresholds.length; i++) {
    const t = config.thresholds[i];

    if (!t || typeof t !== 'object') {
      throw new Error(`CONFIG_ERROR: Threshold at index ${i} is not a valid object.`);
    }

    if (!t.grade || typeof t.grade !== 'string' || t.grade.trim() === '') {
      throw new Error(`CONFIG_ERROR: Threshold at index ${i} is missing a grade label.`);
    }

    if (typeof t.minPercentage !== 'number' || isNaN(t.minPercentage)) {
      throw new Error(`CONFIG_ERROR: Threshold for "${t.grade}" has invalid minPercentage.`);
    }

    if (typeof t.maxPercentage !== 'number' || isNaN(t.maxPercentage)) {
      throw new Error(`CONFIG_ERROR: Threshold for "${t.grade}" has invalid maxPercentage.`);
    }

    // Bounds check
    if (t.minPercentage < 0 || t.minPercentage > 100) {
      throw new Error(`CONFIG_ERROR: minPercentage for "${t.grade}" must be between 0 and 100.`);
    }
    if (t.maxPercentage < 0 || t.maxPercentage > 100) {
      throw new Error(`CONFIG_ERROR: maxPercentage for "${t.grade}" must be between 0 and 100.`);
    }

    // min <= max
    if (t.minPercentage > t.maxPercentage) {
      throw new Error(`CONFIG_ERROR: minPercentage cannot exceed maxPercentage for "${t.grade}".`);
    }
  }

  // 5. Detect overlapping thresholds
  // Sort thresholds by minPercentage ascending to check overlap
  const sorted = [...config.thresholds].sort((a, b) => a.minPercentage - b.minPercentage);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next    = sorted[i + 1];

    if (current.maxPercentage > next.minPercentage) {
      throw new Error(
        `CONFIG_ERROR: Overlapping grading boundaries detected between ` +
        `"${current.grade}" (${current.minPercentage}-${current.maxPercentage}) ` +
        `and "${next.grade}" (${next.minPercentage}-${next.maxPercentage}).`,
      );
    }
  }
}
