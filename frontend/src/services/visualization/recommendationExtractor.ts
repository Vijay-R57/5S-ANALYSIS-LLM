/**
 * src/services/visualization/recommendationExtractor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Module 1: Recommendation Extractor
 *
 * Extracts raw actionable recommendation text from completed audit JSON.
 * Intentionally IGNORES scores, ratings, confidence, reasoning, and evidence
 * so that audit scoring data never pollutes the visualization pipeline.
 *
 * Zero-Regression Guarantee: Reads from FutureAuditRecommendation[] (read-only).
 * Does NOT write to or call any audit engine component.
 */

import type { FutureAuditRecommendation } from '@/modules/audit/types';

/** Lightweight DTO – only the text we need for normalization */
export interface RawPhysicalRecommendation {
  pillarName: string;
  recommendationText: string;
  problemText: string;
}

/**
 * Extracts physical improvement text from the audit recommendation list.
 * Returns an empty array when no actionable recommendations exist, which
 * causes the IVE service to skip visualization gracefully.
 */
export function extractPhysicalRecommendations(
  recommendations: FutureAuditRecommendation[]
): RawPhysicalRecommendation[] {
  if (!recommendations || recommendations.length === 0) return [];

  return recommendations
    .filter((rec) => !!rec.recommendation && rec.recommendation.trim().length > 0)
    .map((rec) => ({
      pillarName: rec.pillarName ?? rec.pillarKey ?? 'General',
      recommendationText: rec.recommendation.trim(),
      problemText: rec.problem?.trim() ?? '',
    }));
}
