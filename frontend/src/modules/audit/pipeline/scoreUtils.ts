/**
 * src/modules/audit/pipeline/scoreUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure scoring utility functions.
 *
 * PRINCIPLES:
 *  - Gemini never calls these functions.
 *  - These are the ONLY place where ratings are converted to numbers.
 *  - These are the ONLY place where pillar/overall scores are calculated.
 *  - No side effects. No Gemini calls. No database calls.
 */

// ── Valid AI Rating type ───────────────────────────────────────────────────────

export type AiRating = 'VERY_GOOD' | 'GOOD' | 'AVERAGE' | 'BAD' | 'VERY_BAD';

export const VALID_RATINGS: readonly AiRating[] = [
  'VERY_GOOD',
  'GOOD',
  'AVERAGE',
  'BAD',
  'VERY_BAD',
];

/** Returns true if the given value is a valid AiRating */
export function isValidRating(value: unknown): value is AiRating {
  return typeof value === 'string' && (VALID_RATINGS as string[]).includes(value);
}

// ── Rating → Score ─────────────────────────────────────────────────────────────

const RATING_TO_SCORE: Record<AiRating, number> = {
  VERY_GOOD: 4,
  GOOD: 3,
  AVERAGE: 2,
  BAD: 1,
  VERY_BAD: 0,
};

/**
 * Converts an AI rating to a numeric score (0–4).
 * This conversion is performed by the application, never by Gemini.
 */
export function ratingToScore(rating: AiRating): number {
  return RATING_TO_SCORE[rating];
}

// ── Score → UI Rating label ────────────────────────────────────────────────────

/**
 * Converts a numeric score (0–4) to the display label expected by
 * FutureAuditQuestion['rating'] and PillarAssessment.tsx.
 */
export function scoreToRatingLabel(
  score: number,
): 'Very Good' | 'Good' | 'Average' | 'Bad' | 'Very Bad' {
  if (score >= 4) return 'Very Good';
  if (score === 3) return 'Good';
  if (score === 2) return 'Average';
  if (score === 1) return 'Bad';
  return 'Very Bad';
}

// ── Pillar rating label ────────────────────────────────────────────────────────

/**
 * Converts a pillar percentage to the overall rating label expected by
 * FuturePillar['rating'].
 */
export function pillarRatingLabel(
  percentage: number,
): 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' | 'Poor' {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Average';
  if (percentage >= 25) return 'Needs Improvement';
  return 'Poor';
}

// ── Grade label ────────────────────────────────────────────────────────────────

/**
 * Converts overall percentage to a grade label.
 * Application owns this table — Gemini never determines grades.
 *
 * 90–100 → A+ Excellent
 * 80–89  → A  Very Good
 * 70–79  → B  Good
 * 60–69  → C  Average
 * 40–59  → D  Needs Improvement
 *  0–39  → F  Poor
 */
export function calculateGradeLabel(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Very Good';
  if (percentage >= 70) return 'Good';
  if (percentage >= 60) return 'Average';
  if (percentage >= 40) return 'Needs Improvement';
  return 'Poor';
}

/** Maps grade label to a color string used by existing UI components */
export function gradeColor(gradeLabel: string): string {
  switch (gradeLabel) {
    case 'Excellent':         return 'green';
    case 'Very Good':         return 'green';
    case 'Good':              return 'yellow';
    case 'Average':           return 'orange';
    case 'Needs Improvement': return 'orange';
    default:                  return 'red';
  }
}

// ── Confidence ─────────────────────────────────────────────────────────────────

/**
 * Returns true if average confidence across all questions is below 60,
 * indicating that manual review is recommended.
 */
export function needsManualReview(confidenceValues: number[]): boolean {
  if (confidenceValues.length === 0) return false;
  const avg = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;
  return avg < 60;
}

/**
 * Returns the average confidence across all questions, rounded to the
 * nearest integer. Returns null for an empty array.
 */
export function averageConfidence(confidenceValues: number[]): number | null {
  if (confidenceValues.length === 0) return null;
  const avg = confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length;
  return Math.round(avg);
}
