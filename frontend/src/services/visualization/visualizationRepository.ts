/**
 * src/services/visualization/visualizationRepository.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Visualization Repository
 *
 * Manages multi-tier persistence of ImprovementVisualizationResult objects.
 * Storage tiers (in order of lookup priority):
 *   1. In-memory cache (fastest, process-scoped)
 *   2. sessionStorage (survives page refreshes in same tab)
 *
 * IMPORTANT ENCAPSULATION RULE:
 *   This module is an INTERNAL implementation detail of iveService.ts.
 *   No UI component, PDF generator, or any other presentation layer may
 *   import or call this module directly. All access must go through
 *   generateImprovementVisualization().
 *
 * Zero-Regression Guarantee: NEW file – no existing module is modified.
 */

import type { ImprovementVisualizationResult } from './types';

const SESSION_PREFIX = 'arcolab_ive_v1_';

// In-memory tier (fastest)
const memoryCache = new Map<string, ImprovementVisualizationResult>();

/**
 * Attempts to retrieve a previously generated result.
 * Returns undefined on cache miss.
 * @param key  Unique audit/session identifier
 */
export function repositoryGet(key: string): ImprovementVisualizationResult | undefined {
  // Tier 1: Memory
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // Tier 2: sessionStorage
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as ImprovementVisualizationResult;
      // Promote to memory tier for subsequent lookups
      memoryCache.set(key, parsed);
      return parsed;
    }
  } catch {
    // sessionStorage may be unavailable (e.g. private mode restrictions)
  }

  return undefined;
}

/**
 * Persists a result to all available storage tiers.
 * @param key     Unique audit/session identifier
 * @param result  The IVE result to persist
 */
export function repositorySet(key: string, result: ImprovementVisualizationResult): void {
  // Tier 1: Memory
  memoryCache.set(key, result);

  // Tier 2: sessionStorage
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(result));
  } catch {
    // Non-critical – memory cache is sufficient for the session
  }
}

/**
 * Removes a result from all tiers (e.g. on explicit session reset).
 * @param key  Unique audit/session identifier
 */
export function repositoryInvalidate(key: string): void {
  memoryCache.delete(key);
  try {
    sessionStorage.removeItem(SESSION_PREFIX + key);
  } catch {
    // Ignore
  }
}

/**
 * Clears all IVE entries from all storage tiers.
 * Should only be called when the user explicitly resets their session.
 */
export function repositoryClearAll(): void {
  memoryCache.clear();
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(SESSION_PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // Ignore
  }
}
