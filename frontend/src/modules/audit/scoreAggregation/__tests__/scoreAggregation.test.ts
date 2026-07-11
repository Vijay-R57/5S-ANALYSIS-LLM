/**
 * src/modules/audit/scoreAggregation/__tests__/scoreAggregation.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vitest Unit Tests for Score Aggregator Engine (Sprint 6.5)
 */

import { describe, it, expect } from 'vitest';
import { calculatePillarScores } from '../pillarCalculator';
import { calculateOverallScore } from '../overallCalculator';
import type { QuestionScore, AggregationConfig } from '../aggregationTypes';

describe('Score Aggregator Engine Unit Tests', () => {

  const defaultConfig: AggregationConfig = {
    pillars:  ['SORT', 'SET_IN_ORDER', 'SHINE', 'STANDARDIZE', 'SUSTAIN'],
    rounding: { decimals: 2 },
  };

  const createMockScore = (options: {
    id:       string;
    pillar:   string;
    score:    number | null;
    maxScore: number | null;
    eligible: boolean;
  }): QuestionScore => ({
    questionId:      options.id,
    pillar:          options.pillar,
    visibility:      options.eligible ? 'VISIBLE' : 'NOT_VISIBLE',
    rating:          options.eligible ? 'GOOD' : 'NOT_SCORED',
    score:           options.score,
    maxScore:        options.maxScore,
    scoreEligible:   options.eligible,
    evaluationTrace: [],
  });

  // ── 1. Normal Pillar Aggregation ───────────────────────────────────────────
  it('calculates pillar score correctly for fully eligible normal questions', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: 3, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q2', pillar: 'SORT', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q3', pillar: 'SORT', score: 2, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'SORT', score: 3, maxScore: 4, eligible: true }),
      // Fill in remaining pillars to satisfy the "all pillars populated" check
      createMockScore({ id: 'Q5', pillar: 'SET_IN_ORDER', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q6', pillar: 'SHINE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q7', pillar: 'STANDARDIZE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q8', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    const res = calculatePillarScores(scores, defaultConfig);
    const sortPillar = res.find(p => p.pillar === 'SORT');

    expect(sortPillar).toBeDefined();
    expect(sortPillar!.questionCount).toBe(4);
    expect(sortPillar!.eligibleQuestions).toBe(4);
    expect(sortPillar!.skippedQuestions).toBe(0);
    expect(sortPillar!.actualScore).toBe(12);
    expect(sortPillar!.maximumScore).toBe(16);
    expect(sortPillar!.percentage).toBe(75.00);
  });

  // ── 2. Mixed Eligibility & Skipped Questions ──────────────────────────────
  it('correctly aggregates mixed eligibility where NOT_SCORED are excluded from actual/max', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: 3, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q2', pillar: 'SORT', score: null, maxScore: null, eligible: false }), // skipped
      createMockScore({ id: 'Q3', pillar: 'SORT', score: 2, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'SORT', score: null, maxScore: null, eligible: false }), // skipped
      createMockScore({ id: 'Q5', pillar: 'SET_IN_ORDER', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q6', pillar: 'SHINE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q7', pillar: 'STANDARDIZE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q8', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    const res = calculatePillarScores(scores, defaultConfig);
    const sortPillar = res.find(p => p.pillar === 'SORT');

    expect(sortPillar).toBeDefined();
    expect(sortPillar!.questionCount).toBe(4);
    expect(sortPillar!.eligibleQuestions).toBe(2);
    expect(sortPillar!.skippedQuestions).toBe(2);
    expect(sortPillar!.actualScore).toBe(5);
    expect(sortPillar!.maximumScore).toBe(8);
    expect(sortPillar!.percentage).toBe(62.50);
  });

  // ── 3. All Questions Skipped ────────────────────────────────────────────────
  it('safely handles a pillar where 100% of questions are skipped (maxScore=0)', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: null, maxScore: null, eligible: false }),
      createMockScore({ id: 'Q2', pillar: 'SORT', score: null, maxScore: null, eligible: false }),
      createMockScore({ id: 'Q3', pillar: 'SET_IN_ORDER', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'SHINE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q5', pillar: 'STANDARDIZE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q6', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    const res = calculatePillarScores(scores, defaultConfig);
    const sortPillar = res.find(p => p.pillar === 'SORT');

    expect(sortPillar).toBeDefined();
    expect(sortPillar!.questionCount).toBe(2);
    expect(sortPillar!.eligibleQuestions).toBe(0);
    expect(sortPillar!.skippedQuestions).toBe(2);
    expect(sortPillar!.actualScore).toBe(0);
    expect(sortPillar!.maximumScore).toBe(0);
    expect(sortPillar!.percentage).toBe(0); // Safely returned 0
  });

  // ── 4. Overall Calculation & Configured Ordering ─────────────────────────────
  it('calculates the overall aggregated score and percentage correctly', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: 3, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q2', pillar: 'SORT', score: null, maxScore: null, eligible: false }),
      createMockScore({ id: 'Q3', pillar: 'SET_IN_ORDER', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'SHINE', score: 2, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q5', pillar: 'STANDARDIZE', score: 1, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q6', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    const pillarScores = calculatePillarScores(scores, defaultConfig);
    const overall = calculateOverallScore(pillarScores, defaultConfig);

    // SORT (3/4), SET_IN_ORDER (4/4), SHINE (2/4), STANDARDIZE (1/4), SUSTAIN (4/4)
    // Sum actual: 3 + 4 + 2 + 1 + 4 = 14
    // Sum max:    4 + 4 + 4 + 4 + 4 = 20
    // Sum eligible: 5
    // Sum skipped:  1
    expect(overall.actualScore).toBe(14);
    expect(overall.maximumScore).toBe(20);
    expect(overall.percentage).toBe(70.00);
    expect(overall.evaluatedQuestions).toBe(5);
    expect(overall.skippedQuestions).toBe(1);
    expect(overall.evaluatedPillars).toBe(5);
  });

  // ── 5. Duplicate Questions Validation ──────────────────────────────────────
  it('throws validation error when duplicate question IDs are detected', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: 3, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q1', pillar: 'SORT', score: 4, maxScore: 4, eligible: true }), // Duplicate Q1
      createMockScore({ id: 'Q2', pillar: 'SET_IN_ORDER', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q3', pillar: 'SHINE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'STANDARDIZE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q5', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    expect(() => {
      calculatePillarScores(scores, defaultConfig);
    }).toThrow('VALIDATION_ERROR: Duplicate question ID "Q1" detected in inputs.');
  });

  // ── 6. Negative Scores Validation ──────────────────────────────────────────
  it('throws validation error if any question has a negative score value', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: -1, maxScore: 4, eligible: true }), // Negative
      createMockScore({ id: 'Q2', pillar: 'SET_IN_ORDER', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q3', pillar: 'SHINE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'STANDARDIZE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q5', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    expect(() => {
      calculatePillarScores(scores, defaultConfig);
    }).toThrow('VALIDATION_ERROR: Question "Q1" has negative score: -1.');
  });

  // ── 7. Invalid Maximum Score Validation ─────────────────────────────────────
  it('throws validation error if any eligible question has an invalid maxScore of 0', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: 2, maxScore: 0, eligible: true }), // MaxScore 0
      createMockScore({ id: 'Q2', pillar: 'SET_IN_ORDER', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q3', pillar: 'SHINE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'STANDARDIZE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q5', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    expect(() => {
      calculatePillarScores(scores, defaultConfig);
    }).toThrow('VALIDATION_ERROR: Question "Q1" has an invalid maxScore of 0.');
  });

  // ── 8. Empty Pillar Validation (Unconfigured/Missing Question) ───────────────
  it('throws validation error if any configured pillar has zero matching questions', () => {
    const scores = [
      createMockScore({ id: 'Q1', pillar: 'SORT', score: 3, maxScore: 4, eligible: true }),
      // SET_IN_ORDER has no matching questions in the collection
      createMockScore({ id: 'Q3', pillar: 'SHINE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q4', pillar: 'STANDARDIZE', score: 4, maxScore: 4, eligible: true }),
      createMockScore({ id: 'Q5', pillar: 'SUSTAIN', score: 4, maxScore: 4, eligible: true }),
    ];

    expect(() => {
      calculatePillarScores(scores, defaultConfig);
    }).toThrow('VALIDATION_ERROR: Configured pillar "SET_IN_ORDER" has no matching questions in the input collection.');
  });

});
