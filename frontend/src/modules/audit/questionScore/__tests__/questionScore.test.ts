/**
 * src/modules/audit/questionScore/__tests__/questionScore.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vitest Unit Tests for Question Score Calculator (Sprint 6.4)
 */

import { describe, it, expect } from 'vitest';
import { calculateQuestionScore } from '../scoreCalculator';
import { DEFAULT_SCORE_MAPPING } from '../scoreMapping';

describe('Question Score Calculator Unit Tests', () => {

  const defaultMockConfig = {
    scoreMapping: DEFAULT_SCORE_MAPPING,
  };

  const createInput = (rating: any) => ({
    questionId:      'SORT_Q1',
    visibility:      'VISIBLE',
    rating,
    evaluationTrace: ['Initial step trace.'],
  });

  // ── 1. Valid Ratings to Numeric Scores ──────────────────────────────────────
  it('converts VERY_GOOD to 4', () => {
    const res = calculateQuestionScore(createInput('VERY_GOOD'), defaultMockConfig);
    expect(res.score).toBe(4);
    expect(res.maxScore).toBe(4);
    expect(res.scoreEligible).toBe(true);
  });

  it('converts GOOD to 3', () => {
    const res = calculateQuestionScore(createInput('GOOD'), defaultMockConfig);
    expect(res.score).toBe(3);
    expect(res.maxScore).toBe(4);
    expect(res.scoreEligible).toBe(true);
  });

  it('converts AVERAGE to 2', () => {
    const res = calculateQuestionScore(createInput('AVERAGE'), defaultMockConfig);
    expect(res.score).toBe(2);
    expect(res.maxScore).toBe(4);
    expect(res.scoreEligible).toBe(true);
  });

  it('converts BAD to 1', () => {
    const res = calculateQuestionScore(createInput('BAD'), defaultMockConfig);
    expect(res.score).toBe(1);
    expect(res.maxScore).toBe(4);
    expect(res.scoreEligible).toBe(true);
  });

  it('converts VERY_BAD to 0', () => {
    const res = calculateQuestionScore(createInput('VERY_BAD'), defaultMockConfig);
    expect(res.score).toBe(0);
    expect(res.maxScore).toBe(4);
    expect(res.scoreEligible).toBe(true);
  });

  // ── 2. NOT_SCORED Behavior ──────────────────────────────────────────────────
  it('converts NOT_SCORED to null scores and marks it ineligible', () => {
    const res = calculateQuestionScore(
      {
        questionId:      'SORT_Q1',
        visibility:      'NOT_VISIBLE',
        rating:          'NOT_SCORED',
        evaluationTrace: ['Not visible trace'],
      },
      defaultMockConfig,
    );
    expect(res.score).toBeNull();
    expect(res.maxScore).toBeNull();
    expect(res.scoreEligible).toBe(false);
  });

  // ── 3. Configuration-Driven Custom Mappings ─────────────────────────────────
  it('respects a custom score mapping in config', () => {
    const customConfig = {
      scoreMapping: {
        VERY_GOOD:  10,
        GOOD:       8,
        AVERAGE:    5,
        BAD:        2,
        VERY_BAD:   1,
        NOT_SCORED: null,
      },
    };
    const res = calculateQuestionScore(createInput('VERY_GOOD'), customConfig);
    expect(res.score).toBe(10);
    expect(res.maxScore).toBe(10);
    expect(res.scoreEligible).toBe(true);
  });

  // ── 4. Invalid Ratings ──────────────────────────────────────────────────────
  it('throws structured error on unknown/invalid rating', () => {
    expect(() => {
      calculateQuestionScore(createInput('UNKNOWN_RATING_ABC'), defaultMockConfig);
    }).toThrow('INPUT_ERROR: Unknown/invalid rating received: "UNKNOWN_RATING_ABC".');
  });

  it('throws structured error on missing rating', () => {
    expect(() => {
      calculateQuestionScore(createInput(null), defaultMockConfig);
    }).toThrow('INPUT_ERROR: Question rating is missing.');
  });

  // ── 5. Missing Mappings & Configuration Errors ──────────────────────────────
  it('throws structured error if score mapping is missing from config', () => {
    expect(() => {
      calculateQuestionScore(createInput('GOOD'), { scoreMapping: null });
    }).toThrow('CONFIG_ERROR: Score mapping configuration is missing or invalid.');
  });

  it('throws structured error if mapping is missing required keys', () => {
    const brokenMapping = {
      VERY_GOOD:  4,
      GOOD:       3,
      AVERAGE:    2,
      // BAD is missing
      VERY_BAD:   0,
      NOT_SCORED: null,
    };
    expect(() => {
      calculateQuestionScore(createInput('GOOD'), { scoreMapping: brokenMapping });
    }).toThrow('CONFIG_ERROR: Score mapping is incomplete. Missing key: "BAD".');
  });

  it('throws structured error if NOT_SCORED does not map to null', () => {
    const brokenMapping = {
      VERY_GOOD:  4,
      GOOD:       3,
      AVERAGE:    2,
      BAD:        1,
      VERY_BAD:   0,
      NOT_SCORED: 99, // invalid, must be null
    };
    expect(() => {
      calculateQuestionScore(createInput('GOOD'), { scoreMapping: brokenMapping });
    }).toThrow('CONFIG_ERROR: NOT_SCORED must map to null.');
  });

});
