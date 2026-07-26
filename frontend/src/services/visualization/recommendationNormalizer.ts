/**
 * src/services/visualization/recommendationNormalizer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Module 2: Recommendation Normalizer
 *
 * Converts raw recommendation text from the extractor into deterministic
 * PhysicalAction objects categorised across the 6 5S visualization domains.
 *
 * The Prompt Builder must never receive raw recommendation strings directly;
 * it only consumes the normalized PhysicalAction[] produced here.
 *
 * Zero-Regression Guarantee: Pure transformation – no I/O, no audit engine calls.
 */

import type { PhysicalAction, PhysicalDomain } from './types';
import type { RawPhysicalRecommendation } from './recommendationExtractor';

// ── Domain keyword classifiers ────────────────────────────────────────────────

const DOMAIN_KEYWORDS: Record<PhysicalDomain, string[]> = {
  CLEANING: [
    'clean', 'sweep', 'wipe', 'wash', 'remove dirt', 'remove dust',
    'remove spill', 'housekeeping', 'mop', 'scrub', 'sanitize', 'debris',
  ],
  ORGANIZATION: [
    'organize', 'sort', 'arrange', 'clutter', 'relocate', 'reposition',
    'remove unnecessary', 'discard', 'red tag', 'seiri', 'eliminate',
    'dispose', 'store', 'loose', 'misplaced',
  ],
  STORAGE: [
    'storage', 'rack', 'shelf', 'cabinet', 'bin', 'pallet', 'container',
    'shadow board', 'designated location', 'store tools', 'tool box',
    'return to', 'designated area',
  ],
  VISUAL_MANAGEMENT: [
    'label', 'sign', 'mark', 'floor marking', 'colour code', 'color code',
    'visual', 'board', 'display', 'poster', 'indicator', 'identification',
    'sticker', 'tag', 'kaizen', 'kanban',
  ],
  SAFETY: [
    'safety', 'hazard', 'ppe', 'emergency', 'fire', 'first aid',
    'guardrail', 'barrier', 'warning', 'caution', 'aisles clear',
    'evacuation', 'protective', 'spill kit',
  ],
  STANDARDIZATION: [
    'standard', 'procedure', 'checklist', 'schedule', 'sop', 'audit board',
    'template', 'routine', 'policy', 'regulation', 'instruction', 'sustain',
    'maintain standard', 'compliance',
  ],
};

/**
 * Classify a recommendation string into a PhysicalDomain.
 * Falls back to ORGANIZATION if no keyword matches.
 */
function classifyDomain(text: string): PhysicalDomain {
  const lower = text.toLowerCase();
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [PhysicalDomain, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return domain;
  }
  return 'ORGANIZATION';
}

/**
 * Converts a raw recommendation text into a deterministic action description.
 * Strips hedging language and converts to a direct physical instruction.
 */
function normalizeActionText(text: string): string {
  return text
    // Strip leading qualifiers
    .replace(/^(ensure|make sure|it is recommended to|consider|try to|you should)\s+/i, '')
    // Capitalise first character
    .replace(/^./, (c) => c.toUpperCase())
    // Trim trailing punctuation
    .replace(/[.;,]+$/, '')
    .trim();
}

/**
 * Transforms raw recommendations into deterministic PhysicalAction objects.
 * The Prompt Builder receives only this normalized form.
 */
export function normalizeRecommendations(
  raw: RawPhysicalRecommendation[]
): PhysicalAction[] {
  return raw.map((r) => ({
    domain: classifyDomain(r.recommendationText + ' ' + r.problemText),
    description: normalizeActionText(r.recommendationText),
    targetArea: r.pillarName,
  }));
}
