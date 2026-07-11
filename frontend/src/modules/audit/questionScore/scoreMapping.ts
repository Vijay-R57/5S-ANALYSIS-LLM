/**
 * src/modules/audit/questionScore/scoreMapping.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.4 — Question Score Calculator: Score Mapping
 *
 * ROLE:
 *   Manages score mappings and provides the default rating-to-score mappings.
 *   Enforces loading from configuration dynamically.
 */

import type { RatingScoreMapping } from './scoreTypes';

/** Default mapping used when no custom mapping is defined in the configuration. */
export const DEFAULT_SCORE_MAPPING: RatingScoreMapping = {
  VERY_GOOD:  4,
  GOOD:       3,
  AVERAGE:    2,
  BAD:        1,
  VERY_BAD:   0,
  NOT_SCORED: null,
};

/**
 * Extracts and returns the RatingScoreMapping from the audit configuration.
 * Falls back to DEFAULT_SCORE_MAPPING if scoreMapping is completely absent from the configuration.
 *
 * @param config - The global audit configuration object.
 */
export function getScoreMapping(config: any): RatingScoreMapping {
  if (config && typeof config === 'object' && 'scoreMapping' in config) {
    return config.scoreMapping;
  }
  return DEFAULT_SCORE_MAPPING;
}
