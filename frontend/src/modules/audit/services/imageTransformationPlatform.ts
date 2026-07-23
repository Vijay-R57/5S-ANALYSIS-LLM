/**
 * src/modules/audit/services/imageTransformationPlatform.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Refinement 1, 5, 6, 7, 8 & 10 — ImageTransformationPlatform
 *
 * Platform architecture decoupling provider specifics from audit domains.
 * Exposes ProviderManager, Provider abstraction, MetadataStore, CacheManager,
 * and RuntimeLogger.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from '@/integrations/supabase/client';
import type { TransformationPlan } from './transformationPlanner';

export interface TransformationMetadata {
  auditId: string;
  transformationId: string;
  provider: string;
  providerModel: string;
  promptVersion: string;
  plannerVersion: string;
  validatorVersion: string;
  generationTimestamp: string;
  processingDurationMs: number;
  transformationStatus: 'complete' | 'failed' | 'outdated' | 'generating';
  sourceImageHash: string;
  recommendationHash: string;
  workspaceContextHash: string;
  cacheVersion: string;
}

export interface PlatformTransformationRequest {
  auditId: string;
  sourceImage: string;
  prompt: string;
  plan: TransformationPlan;
  sourceImageHash: string;
  recommendationHash: string;
  workspaceContextHash: string;
}

export interface PlatformTransformationResponse {
  transformationId: string;
  transformedImageUrl: string;
  status: 'complete' | 'failed';
  errorMessage?: string;
  metadata: TransformationMetadata;
}

export const PLATFORM_VERSION = '1.0.0';

/**
 * Interface contract for AI Image Transformation Providers (Vertex, Future Models).
 */
export interface ImageTransformationProvider {
  name: string;
  model: string;
  region: string;
  isAvailable(): Promise<boolean>;
  transformImage(request: PlatformTransformationRequest): Promise<{ imageUrl: string; modelUsed: string }>;
}

/**
 * Vertex AI Image Editing Provider implementation.
 */
export class VertexImageEditingProvider implements ImageTransformationProvider {
  name = 'vertex';
  model = import.meta.env.VITE_VERTEX_MODEL || 'imagen-3.0-capability-001';
  region = import.meta.env.VITE_VERTEX_REGION || 'us-central1';

  async isAvailable(): boolean {
    return true;
  }

  async transformImage(request: PlatformTransformationRequest): Promise<{ imageUrl: string; modelUsed: string }> {
    const { data, error } = await supabase.functions.invoke('transform-workplace-image', {
      body: {
        sourceImage: request.sourceImage,
        auditId: request.auditId,
        context: request.plan.context,
        recommendations: request.plan.operations,
        prompt: request.prompt,
      },
    });

    if (!error && data && data.status === 'complete' && data.imageUrl) {
      return {
        imageUrl: data.imageUrl,
        modelUsed: data.metadata?.imageModel || this.model,
      };
    }

    throw new Error(error?.message || data?.errorMessage || 'Vertex AI Edge Function call unavailable.');
  }
}

/**
 * Provider Manager — Handles provider resolution and configuration.
 */
export class ProviderManager {
  private provider: ImageTransformationProvider;

  constructor() {
    // Configured via environment variables; defaults to Vertex AI Provider
    this.provider = new VertexImageEditingProvider();
  }

  getProvider(): ImageTransformationProvider {
    return this.provider;
  }
}

/**
 * Cache Manager — Multi-hash cache validation.
 */
export class CacheManager {
  private cache = new Map<string, PlatformTransformationResponse>();

  getCacheKey(
    auditId: string,
    sourceImageHash: string,
    recHash: string,
    ctxHash: string,
    plannerVersion: string,
    promptVersion: string,
    providerModel: string
  ): string {
    return `${auditId}_${sourceImageHash}_${recHash}_${ctxHash}_${plannerVersion}_${promptVersion}_${providerModel}`;
  }

  get(key: string): PlatformTransformationResponse | undefined {
    return this.cache.get(key);
  }

  set(key: string, response: PlatformTransformationResponse): void {
    this.cache.set(key, response);
  }
}

/**
 * Runtime Logger — Structured logging across execution stages.
 */
export class RuntimeLogger {
  static logStage(stage: string, status: 'PASS' | 'FAIL' | 'NOTICE', details?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    console.log(`[ImageTransformationPlatform] [${stage}] [${status}] [${timestamp}]`, details || '');
  }
}

export const platformProviderManager = new ProviderManager();
export const platformCacheManager = new CacheManager();
