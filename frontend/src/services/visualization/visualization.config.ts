/**
 * src/services/visualization/visualization.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – IVE Configuration Layer
 *
 * Provider (`defaultProvider`) and model (`defaultModel`) are treated as
 * deployment configuration, NOT as architectural dependencies. Future providers
 * can be adopted by changing these values and supplying the matching adapter.
 *
 * Zero-Regression Guarantee: NEW file – no existing module is modified.
 */

export const VISUALIZATION_CONFIG = {
  /** Feature flag – set to false to disable IVE entirely */
  enabled: true,

  // ── Provider (deployment config – not an architectural dependency) ──────────
  /** Logical provider key used to select the adapter at runtime */
  defaultProvider: 'openai',
  /** Configured model identifier – resolved through the adapter, never hardcoded in engine code */
  defaultModel: 'gpt-image-1',

  // ── Network & Retry ─────────────────────────────────────────────────────────
  /** Maximum milliseconds to wait for the provider response */
  timeoutMs: 30_000,
  /** Maximum number of retries on technical validation failure (≤ 1 recommended) */
  maxRetries: 1,

  // ── Output ──────────────────────────────────────────────────────────────────
  resolution: {
    width: 1024,
    height: 1024,
  },

  // ── Independent Versioning Artifacts ────────────────────────────────────────
  versions: {
    /** Visualization prompt version – tracked independently of auditPromptVersion (v3.2) */
    visualizationPromptVersion: 'v1.1',
    /** Scene Preservation Policy version */
    scenePolicyVersion: '1.0',
    /** Visualization Context schema version */
    visualizationContextVersion: '1.0',
  },

  // ── Disclaimer ──────────────────────────────────────────────────────────────
  disclaimerText:
    'This visualization is an illustrative preview generated from the approved 5S audit ' +
    'recommendations. It represents an expected post-improvement workplace and should not ' +
    'be interpreted as an actual photograph of completed work.',
} as const;
