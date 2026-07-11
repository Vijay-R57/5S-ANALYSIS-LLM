/**
 * src/modules/audit/trace/traceValidator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Audit Debug Trace: Trace Validator
 *
 * ROLE:
 *   Validates the structural integrity and logic of the generated AuditDebugTrace.
 *   Verifies:
 *     - All 14 canonical stages are present (Trace Completeness).
 *     - Stages appear in the exact configured sequence (Stage Ordering).
 *     - No duplicate stages are present.
 *     - Timestamps and durations are non-negative and mathematically valid.
 *     - Trace begins with "Audit Started" and ends with "Audit Completed".
 *   Throws Errors on failure to support test suite requirements.
 */

import type { AuditDebugTrace } from './traceTypes';
import { CANONICAL_STAGES } from './traceTypes';

/**
 * Validates the generated AuditDebugTrace.
 * Throws an Error if any structural check fails.
 *
 * @param trace - The audit debug trace to validate.
 */
export function validateAuditTrace(trace: AuditDebugTrace): void {
  if (!trace || typeof trace !== 'object') {
    throw new Error('TRACE_VALIDATION_ERROR: Trace object is missing or corrupt.');
  }

  const stages = trace.stages ?? [];

  // 1. Pipeline Begins and Completes Correctly
  if (stages.length === 0) {
    throw new Error('TRACE_VALIDATION_ERROR: No stages recorded in trace.');
  }

  if (stages[0].stage !== 'Audit Started') {
    throw new Error(`TRACE_VALIDATION_ERROR: Trace must begin with "Audit Started". Found: "${stages[0].stage}".`);
  }

  const lastStage = stages[stages.length - 1].stage;
  if (lastStage !== 'Audit Completed') {
    throw new Error(`TRACE_VALIDATION_ERROR: Trace must end with "Audit Completed". Found: "${lastStage}".`);
  }

  // 2. No Duplicate Stages
  const seenStages = new Set<string>();
  for (const s of stages) {
    if (seenStages.has(s.stage)) {
      throw new Error(`TRACE_VALIDATION_ERROR: Duplicate stage "${s.stage}" detected in trace.`);
    }
    seenStages.add(s.stage);
  }

  // 3. Trace Completeness (All 14 canonical stages exist)
  for (const expected of CANONICAL_STAGES) {
    if (!seenStages.has(expected)) {
      throw new Error(`TRACE_VALIDATION_ERROR: Missing stage "${expected}" in trace.`);
    }
  }

  // 4. Stage Ordering
  // Since all 14 stages are present and there are no duplicates, we just verify
  // that their indices in trace.stages match their indices in CANONICAL_STAGES.
  for (let i = 0; i < CANONICAL_STAGES.length; i++) {
    const expected = CANONICAL_STAGES[i];
    const actual   = stages[i].stage;

    if (expected !== actual) {
      throw new Error(
        `TRACE_VALIDATION_ERROR: Incorrect stage order at index ${i}. ` +
        `Expected: "${expected}". Actual: "${actual}".`,
      );
    }
  }

  // 5. Execution Timing Validation
  for (const s of stages) {
    if (typeof s.duration !== 'number' || isNaN(s.duration) || s.duration < 0) {
      throw new Error(`TRACE_VALIDATION_ERROR: Stage "${s.stage}" has invalid duration: ${s.duration}.`);
    }

    const start = Date.parse(s.startTime);
    const end   = Date.parse(s.endTime);

    if (isNaN(start)) {
      throw new Error(`TRACE_VALIDATION_ERROR: Stage "${s.stage}" has invalid startTime: "${s.startTime}".`);
    }
    if (isNaN(end)) {
      throw new Error(`TRACE_VALIDATION_ERROR: Stage "${s.stage}" has invalid endTime: "${s.endTime}".`);
    }

    if (start > end) {
      throw new Error(`TRACE_VALIDATION_ERROR: Stage "${s.stage}" has startTime after endTime.`);
    }
  }
}
