/**
 * src/modules/audit/trace/stageRecorder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sprint 6.6 — Audit Debug Trace: Stage Recorder
 *
 * ROLE:
 *   Creates immutable PipelineStageTrace records from timing and status info.
 */

import type { PipelineStageTrace } from './traceTypes';

/**
 * Constructs an immutable PipelineStageTrace object.
 *
 * @param stage            - The name of the stage (e.g. "Image Validation").
 * @param timing           - Start time, end time, and duration.
 * @param status           - Status ("PASS" or "FAIL").
 * @param pipelineDecision - Next pipeline routing decision.
 * @param options          - Optional inputs, outputs, warnings, and errors.
 */
export function recordStageTrace(
  stage:            string,
  timing:           { startTime: string; endTime: string; duration: number },
  status:           'PASS' | 'FAIL',
  pipelineDecision: string,
  options?: {
    inputSummary?:  any;
    outputSummary?: any;
    warnings?:      string[];
    errors?:        string[];
  },
): PipelineStageTrace {
  return {
    stage,
    startTime:        timing.startTime,
    endTime:          timing.endTime,
    duration:         timing.duration,
    status,
    inputSummary:     options?.inputSummary    ? JSON.parse(JSON.stringify(options.inputSummary)) : undefined,
    outputSummary:    options?.outputSummary   ? JSON.parse(JSON.stringify(options.outputSummary)) : undefined,
    warnings:         options?.warnings        ? [...options.warnings] : [],
    errors:           options?.errors          ? [...options.errors] : [],
    pipelineDecision,
  };
}
