/**
 * src/modules/audit/pipeline/debug.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight AI pipeline debug utility.
 *
 * Controlled by:  VITE_AI_DEBUG=true
 * Default:        disabled (no-op, zero overhead in production)
 *
 * RULES:
 *  - All pipeline debug output goes through this file — never call console directly.
 *  - Never log API keys, auth tokens, supabase keys, or any secret.
 *  - Never log the raw base64 image — log metadata only (size, type).
 *  - When VITE_AI_DEBUG is false/undefined, every function is a strict no-op.
 *  - No logging libraries. No disk writes. No database writes. No external services.
 */

const IS_DEBUG = import.meta.env.VITE_AI_DEBUG === 'true';

const PREFIX = '[AI Debug]';

/** Log a general info message. No-op when AI debug is disabled. */
export function debugLog(message: string, ...data: unknown[]): void {
  if (!IS_DEBUG) return;
  if (data.length > 0) {
    console.log(`${PREFIX} ${message}`, ...data);
  } else {
    console.log(`${PREFIX} ${message}`);
  }
}

/** Open a collapsible console group. No-op when AI debug is disabled. */
export function debugGroup(label: string): void {
  if (!IS_DEBUG) return;
  console.group(`${PREFIX} ${label}`);
}

/** Close the most recently opened console group. No-op when AI debug is disabled. */
export function debugGroupEnd(): void {
  if (!IS_DEBUG) return;
  console.groupEnd();
}

/** Log an error with label. No-op when AI debug is disabled. */
export function debugError(label: string, err: unknown): void {
  if (!IS_DEBUG) return;
  console.error(`${PREFIX} ❌ ${label}`, err);
}

/**
 * Returns a shallow copy of an object with sensitive keys removed.
 * Use before logging any object that might contain keys from environment or headers.
 */
export function sanitise(obj: Record<string, unknown>): Record<string, unknown> {
  const BLOCKED = new Set([
    'apiKey', 'api_key', 'key', 'token', 'secret', 'authorization',
    'password', 'cookie', 'session', 'accessToken', 'refreshToken',
    'supabaseKey', 'publishableKey', 'VITE_SUPABASE_PUBLISHABLE_KEY',
  ]);

  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    safe[k] = BLOCKED.has(k) ? '***REDACTED***' : v;
  }
  return safe;
}

/**
 * Extracts safe metadata from a base64 image string.
 * Never logs the image data itself — only size, type, and resolution estimate.
 */
export function debugImageInfo(imageBase64: string): void {
  if (!IS_DEBUG) return;

  // Detect mime type from data URI prefix (e.g. "data:image/jpeg;base64,...")
  let mimeType = 'unknown';
  let rawB64   = imageBase64;

  if (imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:([^;]+);base64,/);
    if (match) {
      mimeType = match[1];
      rawB64   = imageBase64.slice(match[0].length);
    }
  } else if (imageBase64.startsWith('/9j/')) {
    mimeType = 'image/jpeg';
  } else if (imageBase64.startsWith('iVBOR')) {
    mimeType = 'image/png';
  }

  // Approximate decoded size: base64 is ~4/3 of binary size
  const sizeKb = Math.round((rawB64.length * 0.75) / 1024);

  debugGroup('Image Metadata');
  debugLog('Type (MIME):', mimeType);
  debugLog('Size (approx):', `${sizeKb} KB`);
  debugLog('Base64 length (chars):', rawB64.length);
  debugGroupEnd();
}
