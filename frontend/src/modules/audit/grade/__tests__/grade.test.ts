/**
 * src/modules/audit/grade/__tests__/grade.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vitest Unit Tests for Grade Engine (Sprint 6.6)
 */

import { describe, it, expect } from 'vitest';
import { calculateGrade } from '../gradeCalculator';
import type { GradingConfig } from '../gradeTypes';

describe('Grade Engine Unit Tests', () => {

  const defaultMockConfig = {};

  // ── 1. Standard Grade Calculations ──────────────────────────────────────────
  it('assigns A+ for 95%', () => {
    const res = calculateGrade(95.00, defaultMockConfig);
    expect(res.grade).toBe('A+');
    expect(res.matchedThreshold).toBe('90-100');
  });

  it('assigns A for 85%', () => {
    const res = calculateGrade(85.00, defaultMockConfig);
    expect(res.grade).toBe('A');
    expect(res.matchedThreshold).toBe('80-89.99');
  });

  it('assigns B for 75%', () => {
    const res = calculateGrade(75.00, defaultMockConfig);
    expect(res.grade).toBe('B');
  });

  it('assigns F for 40%', () => {
    const res = calculateGrade(40.00, defaultMockConfig);
    expect(res.grade).toBe('F');
  });

  // ── 2. Boundary Values ──────────────────────────────────────────────────────
  it('correctly resolves boundary percentages', () => {
    // A+ lower bound
    expect(calculateGrade(90.00, defaultMockConfig).grade).toBe('A+');
    // A upper bound
    expect(calculateGrade(89.99, defaultMockConfig).grade).toBe('A');
    // A lower bound
    expect(calculateGrade(80.00, defaultMockConfig).grade).toBe('A');
    // B upper bound
    expect(calculateGrade(79.99, defaultMockConfig).grade).toBe('B');
    // F upper bound
    expect(calculateGrade(49.99, defaultMockConfig).grade).toBe('F');
    // F lower bound
    expect(calculateGrade(0.00, defaultMockConfig).grade).toBe('F');
  });

  // ── 3. Configuration-Driven Custom Scales ──────────────────────────────────
  it('respects a custom grading scale configuration', () => {
    const customConfig = {
      gradingConfig: {
        version: 'custom-2.0',
        thresholds: [
          { grade: 'PASS', minPercentage: 60.00, maxPercentage: 100.00 },
          { grade: 'FAIL', minPercentage: 0.00,  maxPercentage: 59.99 },
        ],
      },
    };

    expect(calculateGrade(75.00, customConfig).grade).toBe('PASS');
    expect(calculateGrade(45.00, customConfig).grade).toBe('FAIL');
  });

  // ── 4. Overlapping Boundaries (Invalid Config) ─────────────────────────────
  it('throws structured error if grading boundaries overlap', () => {
    const overlapConfig = {
      gradingConfig: {
        version: 'bad-1.0',
        thresholds: [
          { grade: 'A', minPercentage: 80.00, maxPercentage: 90.00 },
          { grade: 'B', minPercentage: 75.00, maxPercentage: 85.00 }, // Overlaps A
        ],
      },
    };

    expect(() => {
      calculateGrade(83.00, overlapConfig);
    }).toThrow('CONFIG_ERROR: Overlapping grading boundaries detected');
  });

  // ── 5. Invalid Input Percentages ───────────────────────────────────────────
  it('throws error when percentage is negative', () => {
    expect(() => {
      calculateGrade(-5.00, defaultMockConfig);
    }).toThrow('INPUT_ERROR: Overall percentage must be between 0 and 100.');
  });

  it('throws error when percentage is above 100', () => {
    expect(() => {
      calculateGrade(105.00, defaultMockConfig);
    }).toThrow('INPUT_ERROR: Overall percentage must be between 0 and 100.');
  });

  // ── 6. Missing Thresholds / No Match ────────────────────────────────────────
  it('throws error if percentage does not fall into any configured threshold', () => {
    const gappedConfig = {
      gradingConfig: {
        version: 'gap-1.0',
        thresholds: [
          { grade: 'A', minPercentage: 90.00, maxPercentage: 100.00 },
          // Gap between 60.00 and 89.99
          { grade: 'F', minPercentage: 0.00,  maxPercentage: 59.99 },
        ],
      },
    };

    expect(() => {
      calculateGrade(75.00, gappedConfig);
    }).toThrow('GRADING_ERROR: No grading threshold boundary matches');
  });

});
