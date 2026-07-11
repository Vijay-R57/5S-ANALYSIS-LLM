/**
 * src/modules/audit/trace/__tests__/trace.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vitest Unit Tests for Audit Debug Trace (Sprint 6.6)
 */

import { describe, it, expect } from 'vitest';
import { buildAuditTrace, CANONICAL_STAGES } from '../index';
import type { PipelineStageTrace, QuestionExecutionTrace } from '../traceTypes';

describe('Audit Debug Trace Unit Tests', () => {

  const mockConfig = {
    metadata: {
      supportedPipelineVersion: 'V3',
      configurationVersion:     '1.0',
      auditTemplate:            'Industrial_5S',
    },
  };

  const createMockStage = (stageName: string, duration: number = 10): PipelineStageTrace => ({
    stage:            stageName,
    startTime:        new Date().toISOString(),
    endTime:          new Date(Date.now() + duration).toISOString(),
    duration,
    status:           'PASS',
    pipelineDecision: 'PASS_TO_NEXT_STAGE',
    warnings:         [],
    errors:           [],
  });

  const createMockStagesList = (): PipelineStageTrace[] => {
    return CANONICAL_STAGES.map(name => createMockStage(name));
  };

  const mockQuestions: QuestionExecutionTrace[] = [
    {
      questionId:     'SORT_Q1',
      visibility:     'VISIBLE',
      evidenceIds:    ['BOX'],
      matchedEvidence:['BOX'],
      rating:         'GOOD',
      score:          3,
      processingTime: 5,
    },
  ];

  // ── 1. Trace Completeness & Alignment ──────────────────────────────────────
  it('successfully compiles a complete, valid trace object when all stages are correctly provided', () => {
    const stages = createMockStagesList();
    const trace = buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);

    expect(trace.auditId).toBe('audit-123');
    expect(trace.pipelineVersion).toBe('V3');
    expect(trace.stages.length).toBe(14);
    expect(trace.questions.length).toBe(1);
    expect((trace as any).trace).toBe(trace.stages); // Spec alias check
  });

  // ── 2. Pipeline Integrity — Starts with 'Audit Started' ─────────────────────
  it('throws error if the trace does not begin with "Audit Started"', () => {
    const stages = createMockStagesList();
    stages[0] = createMockStage('Wrong Start Stage');

    expect(() => {
      buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);
    }).toThrow('TRACE_VALIDATION_ERROR: Trace must begin with "Audit Started".');
  });

  // ── 3. Pipeline Integrity — Ends with 'Audit Completed' ───────────────────
  it('throws error if the trace does not end with "Audit Completed"', () => {
    const stages = createMockStagesList();
    stages[stages.length - 1] = createMockStage('Wrong End Stage');

    expect(() => {
      buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);
    }).toThrow('TRACE_VALIDATION_ERROR: Trace must end with "Audit Completed".');
  });

  // ── 4. Stage Ordering Check ────────────────────────────────────────────────
  it('throws error if stages are out of canonical order', () => {
    const stages = createMockStagesList();
    // Swap 2nd and 3rd stages
    const temp = stages[1];
    stages[1] = stages[2];
    stages[2] = temp;

    expect(() => {
      buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);
    }).toThrow('TRACE_VALIDATION_ERROR: Incorrect stage order at index 1.');
  });

  // ── 5. Duplicate Stage Check ───────────────────────────────────────────────
  it('throws error when a stage is duplicated in the sequence', () => {
    const stages = createMockStagesList();
    // Replace 2nd stage with duplicate of 1st ("Audit Started")
    stages[1] = createMockStage('Audit Started');

    expect(() => {
      buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);
    }).toThrow('TRACE_VALIDATION_ERROR: Duplicate stage "Audit Started" detected in trace.');
  });

  // ── 6. Missing Stage Check ─────────────────────────────────────────────────
  it('throws error when a canonical stage is missing', () => {
    // Remove a stage from the middle (index 1: "Image Validation")
    const stages = createMockStagesList();
    stages.splice(1, 1);

    expect(() => {
      buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);
    }).toThrow('TRACE_VALIDATION_ERROR: Missing stage "Image Validation" in trace.');
  });

  // ── 7. Execution Timing Validation ─────────────────────────────────────────
  it('throws error when stage duration is negative', () => {
    const stages = createMockStagesList();
    stages[2].duration = -5; // Negative duration

    expect(() => {
      buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);
    }).toThrow('TRACE_VALIDATION_ERROR: Stage "Gemini Vision" has invalid duration: -5.');
  });

  it('throws error when startTime is after endTime', () => {
    const stages = createMockStagesList();
    stages[3].startTime = new Date(Date.now() + 50000).toISOString();
    stages[3].endTime   = new Date().toISOString(); // End before start

    expect(() => {
      buildAuditTrace('audit-123', mockConfig, stages, mockQuestions);
    }).toThrow('Stage "Structured Observation" has startTime after endTime.');
  });

});
