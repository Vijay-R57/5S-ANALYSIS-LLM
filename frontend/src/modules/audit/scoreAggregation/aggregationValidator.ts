/**
 * src/modules/audit/scoreAggregation/aggregationValidator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.5 — Score Aggregator Engine: Aggregation Validator
 *
 * ROLE:
 *   Validates the integrity of QuestionScores and AggregationConfig before
 *   performing mathematical aggregation.
 *   Detects: missing/unconfigured pillars, duplicate questions, negative scores,
 *   invalid maximum scores, and questions without a pillar.
 *   Throws structured Errors to halt execution on invalid data.
 */

import type { QuestionScore, AggregationConfig } from './aggregationTypes';

/**
 * Validates the inputs and configuration for score aggregation.
 * Throws a structured Error if any check fails.
 *
 * @param questionScores - The array of scores to validate.
 * @param config         - The aggregation configuration.
 */
export function validateAggregationInputs(
  questionScores: QuestionScore[],
  config:         AggregationConfig,
): void {
  // 1. Check configuration
  if (!config || !Array.isArray(config.pillars) || config.pillars.length === 0) {
    throw new Error('CONFIG_ERROR: Aggregation configuration is missing or contains no pillars.');
  }

  const configuredPillars = new Set<string>(config.pillars);

  // Track seen question IDs to detect duplicates
  const seenQuestionIds = new Set<string>();

  // Track which pillars are actually populated by questions
  const populatedPillars = new Set<string>();

  for (const qs of questionScores) {
    const qid = qs.questionId ?? 'UNKNOWN';

    // 2. Validate Question Without Pillar
    if (!qs.pillar || typeof qs.pillar !== 'string' || qs.pillar.trim() === '') {
      throw new Error(`VALIDATION_ERROR: Question "${qid}" is missing a pillar assignment.`);
    }

    // 3. Validate Missing Pillar (question references a pillar not in the config)
    if (!configuredPillars.has(qs.pillar)) {
      throw new Error(`VALIDATION_ERROR: Question "${qid}" references unconfigured pillar "${qs.pillar}".`);
    }

    populatedPillars.add(qs.pillar);

    // 4. Validate Duplicate Question IDs
    if (seenQuestionIds.has(qs.questionId)) {
      throw new Error(`VALIDATION_ERROR: Duplicate question ID "${qs.questionId}" detected in inputs.`);
    }
    seenQuestionIds.add(qs.questionId);

    // 5. Validate Numeric Scores & Bounds
    if (qs.scoreEligible) {
      if (qs.score === null || qs.score === undefined) {
        throw new Error(`VALIDATION_ERROR: Question "${qid}" is eligible but score is null.`);
      }
      if (qs.maxScore === null || qs.maxScore === undefined) {
        throw new Error(`VALIDATION_ERROR: Question "${qid}" is eligible but maxScore is null.`);
      }

      // Negative Scores
      if (qs.score < 0) {
        throw new Error(`VALIDATION_ERROR: Question "${qid}" has negative score: ${qs.score}.`);
      }
      if (qs.maxScore < 0) {
        throw new Error(`VALIDATION_ERROR: Question "${qid}" has negative maxScore: ${qs.maxScore}.`);
      }

      // Invalid Maximum Score (maxScore must be > 0 for eligible questions)
      if (qs.maxScore === 0) {
        throw new Error(`VALIDATION_ERROR: Question "${qid}" has an invalid maxScore of 0.`);
      }

      // Score exceeds max score bounds check
      if (qs.score > qs.maxScore) {
        throw new Error(`VALIDATION_ERROR: Question "${qid}" has score (${qs.score}) exceeding maxScore (${qs.maxScore}).`);
      }
    } else {
      // Ineligible questions must have null scores
      if (qs.score !== null || qs.maxScore !== null) {
        throw new Error(`VALIDATION_ERROR: Ineligible question "${qid}" must have null score and maxScore.`);
      }
    }
  }

  // 6. Validate Missing Pillar (configured pillar has no matching questions)
  // This is warning/advisory or hard error? The spec says:
  // "Detect: Missing Pillar... Return structured errors."
  // A configured pillar with zero matching questions is an error because it means the
  // template configuration or input is incomplete. Let's throw on it.
  for (const pillar of config.pillars) {
    if (!populatedPillars.has(pillar)) {
      throw new Error(`VALIDATION_ERROR: Configured pillar "${pillar}" has no matching questions in the input collection.`);
    }
  }
}
