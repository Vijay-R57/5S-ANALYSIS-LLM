/**
 * src/modules/audit/trace/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Audit Debug Trace: Public API
 *
 * ROLE:
 *   Public barrel for the Debug Trace system.
 */

export { buildAuditTrace } from './auditTraceBuilder';
export { recordStageTrace } from './stageRecorder';
export { ExecutionTimer }   from './executionTimer';
export { validateAuditTrace } from './traceValidator';

export type {
  PipelineStageTrace,
  QuestionExecutionTrace,
  AuditDebugTrace,
} from './traceTypes';
export { CANONICAL_STAGES } from './traceTypes';
