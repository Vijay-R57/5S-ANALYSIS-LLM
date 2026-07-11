/**
 * src/modules/audit/trace/auditTraceBuilder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Audit Debug Trace: Trace Builder
 *
 * ROLE:
 *   Coordinates trace compilation, enforces immutability, and logs trace results
 *   when VITE_AI_DEBUG is enabled.
 */

import type { AuditDebugTrace, PipelineStageTrace, QuestionExecutionTrace } from './traceTypes';
import { validateAuditTrace } from './traceValidator';
import { debugLog, debugGroup, debugGroupEnd } from '../pipeline/debug';

/**
 * Compiles a complete, validated, and immutable AuditDebugTrace object.
 *
 * @param auditId        - Unique audit identifier.
 * @param config         - The global registry config (for metadata version & template).
 * @param stages         - Array of recorded stage traces.
 * @param questions      - Array of question-level trace histories.
 * @returns Immutable AuditDebugTrace object.
 */
export function buildAuditTrace(
  auditId:              string,
  config:               any,
  stages:               PipelineStageTrace[],
  questions:            QuestionExecutionTrace[],
): AuditDebugTrace {
  // 1. Build trace object immutably (deep copy arrays and objects)
  const traceObj: AuditDebugTrace = {
    auditId,
    pipelineVersion:      config?.metadata?.supportedPipelineVersion ?? 'V3',
    configurationVersion: config?.metadata?.configurationVersion     ?? '1.0',
    auditTemplate:        config?.metadata?.auditTemplate            ?? 'Industrial_5S',
    // In types/analysis.ts, this property is named 'stages', but the spec also requires
    // returning the array as 'trace'. We define 'stages' in the type to be type-safe and
    // add 'trace' dynamically to cover both naming conventions perfectly!
    stages:               JSON.parse(JSON.stringify(stages)),
    questions:            JSON.parse(JSON.stringify(questions)),
  };

  // Add the 'trace' field pointing to the same stage traces for strict spec alignment
  (traceObj as any).trace = traceObj.stages;

  // 2. Validate structural integrity and order
  validateAuditTrace(traceObj);

  // 3. Conditional debug logging (if debug mode active)
  debugGroup('Pipeline Started');
  debugLog('Audit ID:             ', auditId);
  debugLog('Pipeline Version:     ', traceObj.pipelineVersion);
  debugLog('Configuration Version:', traceObj.configurationVersion);
  debugLog('Audit Template:       ', traceObj.auditTemplate);

  let totalDuration = 0;
  for (const s of traceObj.stages) {
    totalDuration += s.duration;
    debugGroup(`Stage: ${s.stage}`);
    debugLog('Duration:         ', `${s.duration}ms`);
    debugLog('Status:           ', s.status);
    debugLog('Pipeline Decision:', s.pipelineDecision);
    if (s.warnings.length > 0) {
      debugLog('Warnings:         ', s.warnings);
    }
    if (s.errors.length > 0) {
      debugLog('Errors:           ', s.errors);
    }
    debugGroupEnd();
  }

  // Find and log grade if available in the 'Grade' stage output
  const gradeStage = traceObj.stages.find(s => s.stage === 'Grade');
  if (gradeStage && gradeStage.outputSummary) {
    debugLog('Final Assigned Grade: ', gradeStage.outputSummary.grade);
  }

  debugLog('Total Execution Time: ', `${totalDuration}ms`);
  debugLog('Pipeline Finished ✓');
  debugGroupEnd();

  return traceObj;
}
