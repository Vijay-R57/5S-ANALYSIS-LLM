/**
 * src/services/visualization/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Improvement Visualization Engine (IVE) Domain Contracts
 *
 * These contracts are the ONLY interface between the IVE service layer and the
 * presentation layer (UI / PDF generator). Presentation layers must never
 * import from adapters, repositories, or prompt builders.
 *
 * Zero-Regression Guarantee: This file is NEW. It does not touch any existing
 * audit pipeline module.
 */

// ── Physical Action Domains ──────────────────────────────────────────────────

export type PhysicalDomain =
  | 'CLEANING'
  | 'ORGANIZATION'
  | 'STORAGE'
  | 'VISUAL_MANAGEMENT'
  | 'SAFETY'
  | 'STANDARDIZATION';

export interface PhysicalAction {
  /** Which 5S domain this action belongs to */
  domain: PhysicalDomain;
  /** Human-readable description of the physical change */
  description: string;
  /** Optional: specific area/zone this action applies to */
  targetArea?: string;
}

// ── Provider Abstraction ─────────────────────────────────────────────────────

export interface AdapterOptions {
  width?: number;
  height?: number;
  timeoutMs?: number;
}

export interface AdapterImageResponse {
  /** Base64-encoded PNG or a URL returned by the provider */
  imageData: string;
  /** Whether the value is a URL or raw base64 */
  dataType: 'url' | 'base64';
  /** Provider-supplied metadata */
  providerMeta?: Record<string, unknown>;
}

/**
 * Provider-agnostic input contract for image editing operations.
 * Decouples the service layer from concrete image transport formats (URL, Base64, Blob, File).
 */
export interface ImageEditingInput {
  originalImage: unknown;
  mimeType: string;
  filename?: string;
}

/**
 * Provider-agnostic image editing / generation adapter.
 * Only the adapter implementation (e.g. OpenAiImageAdapter) may contain
 * provider-specific code. The IVE engine communicates exclusively through
 * this interface.
 */
export interface ImageGeneratorAdapter {
  /** Stable provider identifier (e.g. "openai") */
  readonly providerId: string;
  /** Stable model identifier (e.g. "gpt-image-1") – from config, not hardcoded */
  readonly providerModel: string;
  /**
   * Generate or edit a workplace image using the canonical original image source.
   * @param prompt  The deterministic visualization edit prompt
   * @param imageInput  Canonical image editing input contract
   * @param options  Optional adapter-level overrides
   */
  generateImage(
    prompt: string,
    imageInput: ImageEditingInput,
    options?: AdapterOptions
  ): Promise<AdapterImageResponse>;
}

// ── Visualization Context ────────────────────────────────────────────────────

/**
 * Centralised context object consumed by the Visualization Prompt Builder.
 * All configuration and versioning data flows through this single structure.
 */
export interface VisualizationContext {
  contextVersion: string;           // e.g. "1.0"
  promptVersion: string;            // e.g. "v1.0"
  scenePolicyVersion: string;       // e.g. "1.0"
  zoneName: string;
  workspaceType: string;
  industry: string;
  configuredProvider: string;       // Generic – never hardcoded
  configuredModel: string;          // Generic – never hardcoded
  actions: PhysicalAction[];
}

// ── Visualization Asset ──────────────────────────────────────────────────────

/**
 * VisualizationAsset allows the service to provide primary, thumbnail,
 * and PDF-optimised variants without changing public APIs.
 */
export interface VisualizationAsset {
  primaryUrl: string;
  thumbnailUrl?: string;
  format: 'png' | 'jpeg' | 'webp';
  width: number;
  height: number;
}

// ── Execution Metadata / Telemetry ───────────────────────────────────────────

export type VisualizationExecutionStatus =
  | 'SUCCESS'
  | 'VALIDATION_FAILED'
  | 'SKIPPED'
  | 'ERROR';

/**
 * Comprehensive diagnostic telemetry for every visualization execution.
 * Intended for logging and monitoring only – does NOT affect audit results.
 */
export interface VisualizationExecutionMetadata {
  visualizationId: string;
  configuredProvider: string;
  configuredProviderModel: string;
  visualizationPromptVersion: string;
  scenePolicyVersion: string;
  visualizationContextVersion: string;
  generationDurationMs: number;
  retryCount: number;
  repositoryHit: boolean;
  cacheHit: boolean;
  executionStatus: VisualizationExecutionStatus;
  timestamp: string;
  failureReason?: string;
}

// ── Standard IVE Result Contract ─────────────────────────────────────────────

/**
 * The single public result contract returned by generateImprovementVisualization().
 * UI components and the PDF generator consume only this structure.
 */
export interface ImprovementVisualizationResult {
  visualizationId: string;
  originalImageUrl: string;
  asset: VisualizationAsset;
  physicalActions: PhysicalAction[];
  metadata: VisualizationExecutionMetadata;
  disclaimerText: string;
}
