/**
 * src/modules/audit/trace/traceTypes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Audit Debug Trace: Types
 *
 * ROLE:
 *   Internal and external types for the Debug Trace system.
 */

import type {
  PipelineStageTrace,
  QuestionExecutionTrace,
  AuditDebugTrace,
} from '@/types/analysis';

export type { PipelineStageTrace, QuestionExecutionTrace, AuditDebugTrace };

/** Ordered list of canonical stages that must appear in a complete trace. */
export const CANONICAL_STAGES = [
  'Audit Started',
  'Image Validation',
  'Gemini Vision',
  'Structured Observation',
  'Observation Validation',
  'Visibility Decision',
  'Rule Configuration',
  'Evidence Mapping',
  'Rule Evaluation',
  'Question Scores',
  'Pillar Scores',
  'Overall Score',
  'Grade',
  'Audit Completed',
] as const;

export type CanonicalStageName = typeof CANONICAL_STAGES[number];
