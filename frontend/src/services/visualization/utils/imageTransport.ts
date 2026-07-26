/**
 * src/services/visualization/utils/imageTransport.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Image Transport Utility
 *
 * Provider-agnostic utility responsible for:
 *   - Normalizing image input types (URL, base64 data-URI, Blob, File)
 *   - Converting URLs / data-URIs into binary File / Blob objects
 *   - Validating image MIME types
 *   - Preserving or generating valid filenames
 *
 * Strictly decoupled from OpenAI or any specific cloud provider.
 * Reusable across future providers (GPT Image, Azure OpenAI, FLUX, Firefly, etc.).
 *
 * Zero-Regression Guarantee: Pure utility module – no audit engine dependency.
 */

import type { ImageEditingInput } from '../types';

const SUPPORTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

/**
 * Validates whether the given MIME type is supported for image transport operations.
 */
export function validateImageMimeType(mimeType: string): boolean {
  if (!mimeType || typeof mimeType !== 'string') return false;
  return SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase().trim());
}

/**
 * Normalizes an ImageEditingInput contract into a binary File or Blob object.
 * Converts data-URIs, HTTP/HTTPS URLs, blob URLs, or raw File/Blob objects.
 *
 * @param input  The provider-agnostic ImageEditingInput contract
 * @param fallbackMime  Default MIME type if unrecognized (default: 'image/png')
 * @returns Promise resolving to a binary File or Blob
 */
export async function toImageFile(
  input: ImageEditingInput,
  fallbackMime = 'image/png'
): Promise<Blob> {
  const original = input.originalImage;

  // 1. Already a File or Blob instance
  if (original instanceof File || original instanceof Blob) {
    return original;
  }

  // 2. String representation (data URI, HTTP URL, or Blob URL)
  if (typeof original === 'string' && original.trim().length > 0) {
    const trimmed = original.trim();

    try {
      const response = await fetch(trimmed);
      if (!response.ok) {
        throw new Error(`Failed to fetch image source (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const detectedMime = blob.type || input.mimeType || fallbackMime;
      const filename = input.filename || 'original_workplace.png';

      return new File([blob], filename, { type: detectedMime });
    } catch (err) {
      throw new Error(
        `Image transport conversion failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  throw new Error(
    'Invalid or missing original image input provided to image transport utility.'
  );
}
