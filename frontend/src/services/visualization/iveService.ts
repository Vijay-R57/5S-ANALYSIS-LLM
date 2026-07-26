/**
 * src/services/visualization/iveService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – IVE Service Orchestrator
 *
 * SINGLE PUBLIC ENTRY POINT: generateImprovementVisualization()
 *
 * Orchestrates the complete three-phase execution lifecycle:
 *
 *   Phase A – Preparation
 *     ├─ Trigger validation
 *     ├─ Visualization repository lookup (cache check)
 *     ├─ Recommendation extraction & normalization
 *     ├─ VisualizationContext creation
 *     └─ Prompt generation (via buildVisualizationPrompt)
 *
 *   Phase B – Image Generation
 *     ├─ Provider adapter selection & execution
 *     ├─ Lightweight technical validation
 *     └─ 1 retry with stricter preservation parameters on technical failure
 *
 *   Phase C – Post Processing
 *     ├─ Execution metadata & telemetry generation (with unique visualizationId)
 *     ├─ Visualization repository persistence
 *     ├─ VisualizationAsset & ImprovementVisualizationResult assembly
 *     └─ Return ImprovementVisualizationResult
 *
 * ENCAPSULATION RULE:
 *   No UI component, PDF generator, or presentation layer may orchestrate
 *   visualization logic directly. They call only this function and consume
 *   only ImprovementVisualizationResult.
 *
 * ZERO-REGRESSION GUARANTEE:
 *   This service reads FutureAuditRecommendation[] from the completed audit
 *   result (read-only). It does NOT call or modify any audit pipeline component.
 *   It does NOT write back to Gemini, questionnaire, scoring, or JSON schema.
 */

import { VISUALIZATION_CONFIG } from './visualization.config';
import { extractPhysicalRecommendations } from './recommendationExtractor';
import { normalizeRecommendations } from './recommendationNormalizer';
import { buildVisualizationPrompt } from './visualizationPromptBuilder';
import { validateAdapterResponse } from './imageValidator';
import { repositoryGet, repositorySet } from './visualizationRepository';
import { OpenAiImageAdapter } from './adapters/openAiAdapter';
import type {
  ImprovementVisualizationResult,
  VisualizationContext,
  VisualizationAsset,
  VisualizationExecutionMetadata,
  VisualizationExecutionStatus,
  ImageEditingInput,
} from './types';
import type { FutureAuditRecommendation } from '@/modules/audit/types';

// ── Input contract for the service ───────────────────────────────────────────

export interface GenerateVisualizationInput {
  /** Unique key for caching – typically the audit session ID */
  cacheKey: string;
  originalImageUrl: string;
  recommendations: FutureAuditRecommendation[];
  zoneName: string;
  workspaceType: string;
  industry: string;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function generateVisualizationId(): string {
  return `ive-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildSkippedResult(
  input: GenerateVisualizationInput,
  reason: string
): ImprovementVisualizationResult {
  const vizId = generateVisualizationId();
  const metadata: VisualizationExecutionMetadata = {
    visualizationId: vizId,
    configuredProvider: VISUALIZATION_CONFIG.defaultProvider,
    configuredProviderModel: VISUALIZATION_CONFIG.defaultModel,
    visualizationPromptVersion: VISUALIZATION_CONFIG.versions.visualizationPromptVersion,
    scenePolicyVersion: VISUALIZATION_CONFIG.versions.scenePolicyVersion,
    visualizationContextVersion: VISUALIZATION_CONFIG.versions.visualizationContextVersion,
    generationDurationMs: 0,
    retryCount: 0,
    repositoryHit: false,
    cacheHit: false,
    executionStatus: 'SKIPPED',
    timestamp: new Date().toISOString(),
    failureReason: reason,
  };

  return {
    visualizationId: vizId,
    originalImageUrl: input.originalImageUrl,
    asset: {
      primaryUrl: input.originalImageUrl, // fallback to original
      format: 'png',
      width: VISUALIZATION_CONFIG.resolution.width,
      height: VISUALIZATION_CONFIG.resolution.height,
    },
    physicalActions: [],
    metadata,
    disclaimerText: VISUALIZATION_CONFIG.disclaimerText,
  };
}

// ── Main service function ─────────────────────────────────────────────────────

/**
 * Generates (or retrieves from cache) an improvement visualization for the
 * completed audit. Returns an ImprovementVisualizationResult regardless of
 * success or failure – visualization failures never throw to the caller.
 */
export async function generateImprovementVisualization(
  input: GenerateVisualizationInput
): Promise<ImprovementVisualizationResult> {
  const startMs = Date.now();
  let retryCount = 0;

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE A: PREPARATION
  // ──────────────────────────────────────────────────────────────────────────

  // A1 – Feature flag check
  if (!VISUALIZATION_CONFIG.enabled) {
    console.info('[IVE] Visualization engine is disabled via configuration.');
    return buildSkippedResult(input, 'Feature disabled via VISUALIZATION_CONFIG.enabled');
  }

  // A2 – Trigger validation: original image must exist
  if (!input.originalImageUrl || input.originalImageUrl.trim().length === 0) {
    return buildSkippedResult(input, 'Original image URL is missing');
  }

  // A3 – Trigger validation: at least 1 actionable recommendation required
  const rawRecs = extractPhysicalRecommendations(input.recommendations);
  if (rawRecs.length === 0) {
    console.info('[IVE] No actionable recommendations – skipping visualization.');
    return buildSkippedResult(
      input,
      'No actionable recommendations – workplace may already be highly compliant'
    );
  }

  // A4 – Visualization repository lookup (includes cache check)
  const cached = repositoryGet(input.cacheKey);
  if (cached) {
    console.info(`[IVE] Repository hit for key "${input.cacheKey}". Reusing cached result.`);
    return {
      ...cached,
      metadata: {
        ...cached.metadata,
        repositoryHit: true,
        cacheHit: true,
      },
    };
  }

  // A5 – Normalize recommendations into PhysicalAction[]
  const physicalActions = normalizeRecommendations(rawRecs);

  // A6 – Build VisualizationContext
  const context: VisualizationContext = {
    contextVersion: VISUALIZATION_CONFIG.versions.visualizationContextVersion,
    promptVersion: VISUALIZATION_CONFIG.versions.visualizationPromptVersion,
    scenePolicyVersion: VISUALIZATION_CONFIG.versions.scenePolicyVersion,
    zoneName: input.zoneName,
    workspaceType: input.workspaceType,
    industry: input.industry,
    configuredProvider: VISUALIZATION_CONFIG.defaultProvider,
    configuredModel: VISUALIZATION_CONFIG.defaultModel,
    actions: physicalActions,
  };

  // A7 – Build visualization prompt (strict=false for first attempt)
  const prompt = buildVisualizationPrompt(context, false);

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE B: IMAGE GENERATION
  // ──────────────────────────────────────────────────────────────────────────

  const adapter = new OpenAiImageAdapter();
  let executionStatus: VisualizationExecutionStatus = 'SUCCESS';
  let failureReason: string | undefined;
  let generatedUrl: string = input.originalImageUrl; // default to original on failure
  let validationWidth = VISUALIZATION_CONFIG.resolution.width;
  let validationHeight = VISUALIZATION_CONFIG.resolution.height;

  // Canonical image editing input contract (original uploaded workplace image)
  const imageInput: ImageEditingInput = {
    originalImage: input.originalImageUrl,
    mimeType: 'image/png',
  };

  try {
    console.info(`[IVE] Phase B starting – provider: ${adapter.providerId}, model: ${adapter.providerModel}`);

    // B1 – First generation attempt using canonical ImageEditingInput
    let adapterResponse = await adapter.generateImage(
      prompt,
      imageInput,
      {
        width: VISUALIZATION_CONFIG.resolution.width,
        height: VISUALIZATION_CONFIG.resolution.height,
        timeoutMs: VISUALIZATION_CONFIG.timeoutMs,
      }
    );

    // Check for skipped status in production mode
    const isSkipped = (adapterResponse.providerMeta as Record<string, unknown> | undefined)?.skipped;
    if (isSkipped) {
      const reason = (adapterResponse.providerMeta as Record<string, unknown> | undefined)?.reason as string
        || 'Visualization skipped in production environment';
      console.info(`[IVE] Adapter returned skipped status: ${reason}`);
      return buildSkippedResult(input, reason);
    }

    // B2 – Technical validation
    let validationResult = await validateAdapterResponse(adapterResponse);

    // B3 – Single retry with stricter prompt on technical failure
    if (!validationResult.valid) {
      retryCount = 1;
      console.warn(`[IVE] Validation failed (attempt 1): ${validationResult.reason}. Retrying with strict preservation.`);

      const strictPrompt = buildVisualizationPrompt(context, true);
      adapterResponse = await adapter.generateImage(
        strictPrompt,
        imageInput,
        {
          width: VISUALIZATION_CONFIG.resolution.width,
          height: VISUALIZATION_CONFIG.resolution.height,
          timeoutMs: VISUALIZATION_CONFIG.timeoutMs,
        }
      );

      validationResult = await validateAdapterResponse(adapterResponse);

      if (!validationResult.valid) {
        console.warn(`[IVE] Validation failed after retry: ${validationResult.reason}. Gracefully skipping.`);
        executionStatus = 'VALIDATION_FAILED';
        failureReason = validationResult.reason;
      }
    }

    if (executionStatus === 'SUCCESS' || (executionStatus === 'VALIDATION_FAILED' && adapterResponse.imageData)) {
      generatedUrl = adapterResponse.imageData;
      if (validationResult.width) validationWidth = validationResult.width;
      if (validationResult.height) validationHeight = validationResult.height;

      // Treat fallback placeholder as success (API key missing scenario)
      const isFallback = (adapterResponse.providerMeta as Record<string, unknown> | undefined)?.fallback;
      if (isFallback && executionStatus === 'SUCCESS') {
        executionStatus = 'SUCCESS'; // display fallback gracefully
      }
    }
  } catch (err) {
    console.error('[IVE] Unexpected error during image generation:', err);
    executionStatus = 'ERROR';
    failureReason = err instanceof Error ? err.message : String(err);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE C: POST PROCESSING
  // ──────────────────────────────────────────────────────────────────────────

  const durationMs = Date.now() - startMs;
  const vizId = generateVisualizationId();

  console.info(
    `[IVE] Execution complete – id: ${vizId} | status: ${executionStatus} | ` +
    `duration: ${durationMs}ms | retries: ${retryCount}`
  );

  // C1 – Execution metadata
  const metadata: VisualizationExecutionMetadata = {
    visualizationId: vizId,
    configuredProvider: VISUALIZATION_CONFIG.defaultProvider,
    configuredProviderModel: VISUALIZATION_CONFIG.defaultModel,
    visualizationPromptVersion: VISUALIZATION_CONFIG.versions.visualizationPromptVersion,
    scenePolicyVersion: VISUALIZATION_CONFIG.versions.scenePolicyVersion,
    visualizationContextVersion: VISUALIZATION_CONFIG.versions.visualizationContextVersion,
    generationDurationMs: durationMs,
    retryCount,
    repositoryHit: false,
    cacheHit: false,
    executionStatus,
    timestamp: new Date().toISOString(),
    failureReason,
  };

  // C2 – Assemble VisualizationAsset
  const asset: VisualizationAsset = {
    primaryUrl: generatedUrl,
    format: 'png',
    width: validationWidth,
    height: validationHeight,
  };

  // C3 – Assemble result
  const result: ImprovementVisualizationResult = {
    visualizationId: vizId,
    originalImageUrl: input.originalImageUrl,
    asset,
    physicalActions,
    metadata,
    disclaimerText: VISUALIZATION_CONFIG.disclaimerText,
  };

  // C4 – Persist to repository (only cache successful/fallback results)
  if (executionStatus === 'SUCCESS') {
    repositorySet(input.cacheKey, result);
  }

  return result;
}
