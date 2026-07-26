import type { ImageGeneratorAdapter, AdapterOptions, AdapterImageResponse, ImageEditingInput } from '../types';
import { VISUALIZATION_CONFIG } from '../visualization.config';
import { toImageFile } from '../utils/imageTransport';

// ── Fallback placeholder image (transparent 1x1 pixel PNG, base64) ────────────
const RAW_SVG_CONTENT = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#1a1a2e"/>
  <rect x="50" y="50" width="924" height="924" rx="16" fill="#0f3460" stroke="#16213e" stroke-width="2"/>
  <text x="512" y="460" text-anchor="middle" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="28" font-weight="bold">
    IMPROVEMENT VISUALIZATION (GPT IMAGE 1)
  </text>
  <text x="512" y="510" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="18">
    Configure VITE_OPENAI_API_KEY to enable
  </text>
  <text x="512" y="555" text-anchor="middle" fill="#94a3b8" font-family="Arial, sans-serif" font-size="18">
    AI workplace photograph image editing
  </text>
  <text x="512" y="610" text-anchor="middle" fill="#64748b" font-family="Arial, sans-serif" font-size="14">
    ARCOLAB Phase 7 - Improvement Visualization Engine
  </text>
</svg>
`;

const FALLBACK_SVG_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(RAW_SVG_CONTENT)))}`;

export class OpenAiImageAdapter implements ImageGeneratorAdapter {
  readonly providerId = VISUALIZATION_CONFIG.defaultProvider;
  readonly providerModel = VISUALIZATION_CONFIG.defaultModel;

  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  }

  async generateImage(
    prompt: string,
    imageInput: ImageEditingInput,
    options?: AdapterOptions
  ): Promise<AdapterImageResponse> {
    const isDev = import.meta.env.DEV ?? true;

    // ── Missing API Key Handling (Dev vs Prod) ────────────────────────────────
    if (!this.apiKey || this.apiKey.trim() === '') {
      if (isDev) {
        console.warn(
          '[IVE OpenAiAdapter] VITE_OPENAI_API_KEY is not configured (DEV mode). ' +
          'Returning fallback placeholder. Set the key in .env to enable image editing.'
        );
        return {
          imageData: FALLBACK_SVG_PLACEHOLDER,
          dataType: 'url',
          providerMeta: { fallback: true, reason: 'API key not configured in development environment' },
        };
      } else {
        console.warn(
          '[IVE OpenAiAdapter] VITE_OPENAI_API_KEY is missing in PRODUCTION mode. ' +
          'Returning skipped status.'
        );
        return {
          imageData: '',
          dataType: 'url',
          providerMeta: {
            fallback: true,
            skipped: true,
            reason: 'API key not configured in production environment',
          },
        };
      }
    }

    const size = options?.width && options?.height
      ? `${options.width}x${options.height}`
      : `${VISUALIZATION_CONFIG.resolution.width}x${VISUALIZATION_CONFIG.resolution.height}`;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options?.timeoutMs ?? VISUALIZATION_CONFIG.timeoutMs
    );

    try {
      // 1. Convert original image source into binary Blob/File using transport utility
      const imageFile = await toImageFile(imageInput);

      // 2. Assemble multipart/form-data payload for OpenAI /v1/images/edits
      const formData = new FormData();
      formData.append('image', imageFile, imageInput.filename || 'original_workplace.png');
      formData.append('prompt', prompt);
      formData.append('model', this.providerModel);
      formData.append('n', '1');
      formData.append('size', size);

      console.info(
        `[IVE OpenAiAdapter] Transmitting original image as editing source to /v1/images/edits ` +
        `using model: ${this.providerModel}, size: ${size}`
      );

      // 3. POST request to /v1/images/edits endpoint
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          // Note: Do NOT set Content-Type header when passing FormData; fetch automatically sets boundary.
        },
        signal: controller.signal,
        body: formData,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Provider HTTP ${response.status}: ${err}`);
      }

      const json = await response.json() as { data: Array<{ url: string }> };
      const url = json?.data?.[0]?.url;

      if (!url) throw new Error('Provider returned empty image URL');

      return {
        imageData: url,
        dataType: 'url',
        providerMeta: { model: this.providerModel, size },
      };
    } catch (err) {
      clearTimeout(timeout);
      console.error('[IVE OpenAiAdapter] Image editing failed:', err);

      if (isDev) {
        return {
          imageData: FALLBACK_SVG_PLACEHOLDER,
          dataType: 'url',
          providerMeta: {
            fallback: true,
            reason: err instanceof Error ? err.message : String(err),
          },
        };
      } else {
        return {
          imageData: '',
          dataType: 'url',
          providerMeta: {
            fallback: true,
            skipped: true,
            reason: err instanceof Error ? err.message : String(err),
          },
        };
      }
    }
  }
}
