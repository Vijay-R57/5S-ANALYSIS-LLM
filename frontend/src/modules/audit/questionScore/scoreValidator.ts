/**
 * src/modules/audit/questionScore/scoreValidator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.4 — Question Score Calculator: Score Validator
 *
 * ROLE:
 *   Validates rating inputs and score mappings.
 *   Throws structured errors on invalid configuration or inputs to halt execution.
 */

import type { AuditRating, RatingScoreMapping } from './scoreTypes';

const VALID_RATINGS = new Set<AuditRating>([
  'VERY_GOOD',
  'GOOD',
  'AVERAGE',
  'BAD',
  'VERY_BAD',
  'NOT_SCORED',
]);

const REQUIRED_MAPPING_KEYS: Array<keyof RatingScoreMapping> = [
  'VERY_GOOD',
  'GOOD',
  'AVERAGE',
  'BAD',
  'VERY_BAD',
  'NOT_SCORED',
];

/**
 * Validates the rating input and the score mapping.
 * Throws a structured Error if any check fails.
 *
 * @param rating  - The rating string to validate.
 * @param mapping - The mapping configuration to validate.
 */
export function validateScoreInput(rating: any, mapping: any): void {
  // 1. Validate mapping exists
  if (!mapping || typeof mapping !== 'object') {
    throw new Error('CONFIG_ERROR: Score mapping configuration is missing or invalid.');
  }

  // 2. Validate mapping completeness (all rating values must be mapped)
  for (const key of REQUIRED_MAPPING_KEYS) {
    if (!(key in mapping)) {
      throw new Error(`CONFIG_ERROR: Score mapping is incomplete. Missing key: "${key}".`);
    }

    const val = mapping[key];
    if (key === 'NOT_SCORED') {
      if (val !== null) {
        throw new Error('CONFIG_ERROR: NOT_SCORED must map to null.');
      }
    } else {
      if (typeof val !== 'number') {
        throw new Error(`CONFIG_ERROR: Mapping for "${key}" must be a number.`);
      }
    }
  }

  // 3. Validate rating exists
  if (rating === undefined || rating === null) {
    throw new Error('INPUT_ERROR: Question rating is missing.');
  }

  // 4. Validate rating is valid
  if (!VALID_RATINGS.has(rating as AuditRating)) {
    throw new Error(`INPUT_ERROR: Unknown/invalid rating received: "${rating}".`);
  }
}
