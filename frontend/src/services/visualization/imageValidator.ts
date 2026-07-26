/**
 * src/services/visualization/imageValidator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Lightweight Technical Image Validator
 *
 * Performs deterministic technical integrity checks on the adapter response.
 * Does NOT perform semantic scene analysis, computer vision, or OCR.
 * Those responsibilities belong to prompt engineering (Scene Preservation Policy).
 *
 * Supported checks:
 *   1. Successful provider response received (non-null)
 *   2. Non-empty image payload
 *   3. Valid image URL format or non-empty base64 string
 *   4. Image loads successfully (dimension check via HTMLImageElement)
 *   5. Dimensions within expected bounds
 *   6. Aspect ratio acceptable (0.5 – 2.0 range)
 *
 * The validator is provider-agnostic and deterministic.
 *
 * Zero-Regression Guarantee: NEW file – no existing module is modified.
 */

import type { AdapterImageResponse } from './types';
import { VISUALIZATION_CONFIG } from './visualization.config';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  width?: number;
  height?: number;
}

const { width: EXPECTED_W, height: EXPECTED_H } = VISUALIZATION_CONFIG.resolution;
const MIN_ASPECT = 0.5;
const MAX_ASPECT = 2.0;

/**
 * Attempts to load the image and verify its dimensions.
 * Returns width/height on success or undefined on failure.
 */
async function loadImageDimensions(
  imageData: string
): Promise<{ width: number; height: number } | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(undefined);
    img.src = imageData;
  });
}

/**
 * Validates technical integrity of the adapter response.
 * Does not perform any semantic or structural image analysis.
 */
export async function validateAdapterResponse(
  response: AdapterImageResponse
): Promise<ValidationResult> {
  // 1. Non-null response
  if (!response) {
    return { valid: false, reason: 'Provider returned null response' };
  }

  // 2. Non-empty image payload
  if (!response.imageData || response.imageData.trim().length === 0) {
    return { valid: false, reason: 'Image payload is empty' };
  }

  // 3. Detect fallback placeholders (injected by adapter when key is missing)
  const meta = response.providerMeta as Record<string, unknown> | undefined;
  if (meta?.fallback === true) {
    // Fallback is a valid soft failure – treat as success for display purposes
    // but mark with a clear reason so telemetry is accurate.
    return { valid: true, reason: 'Fallback placeholder (API key not configured)' };
  }

  // 4. URL format check (basic)
  if (response.dataType === 'url') {
    const isHttpUrl = response.imageData.startsWith('http');
    const isDataUrl = response.imageData.startsWith('data:');
    if (!isHttpUrl && !isDataUrl) {
      return { valid: false, reason: 'Invalid image URL format' };
    }
  }

  // 5. Try loading image and checking dimensions (browser-based check)
  const dims = await loadImageDimensions(response.imageData);
  if (!dims) {
    return { valid: false, reason: 'Image failed to load – possible format or network issue' };
  }

  const { width, height } = dims;

  // 6. Minimum size check
  if (width < 64 || height < 64) {
    return {
      valid: false,
      reason: `Image dimensions too small: ${width}×${height}`,
    };
  }

  // 7. Aspect ratio check
  const aspectRatio = width / height;
  if (aspectRatio < MIN_ASPECT || aspectRatio > MAX_ASPECT) {
    return {
      valid: false,
      reason: `Unexpected aspect ratio ${aspectRatio.toFixed(2)} (expected ${MIN_ASPECT}–${MAX_ASPECT})`,
      width,
      height,
    };
  }

  // 8. Expected resolution check (soft warning – not a failure)
  const sizeOk = Math.abs(width - EXPECTED_W) < 256 && Math.abs(height - EXPECTED_H) < 256;
  if (!sizeOk) {
    console.warn(
      `[IVE Validator] Image size ${width}×${height} differs from expected ` +
      `${EXPECTED_W}×${EXPECTED_H}. Accepting anyway.`
    );
  }

  return { valid: true, width, height };
}
