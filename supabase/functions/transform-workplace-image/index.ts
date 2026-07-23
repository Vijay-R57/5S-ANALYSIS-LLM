// supabase/functions/transform-workplace-image/index.ts
/**
 * ARCOLAB — Vertex AI Image Transformation Service Edge Function
 *
 * Dedicated backend endpoint for image-conditioned 5S workplace transformation.
 * Authenticates with Google Cloud Vertex AI Image Editing API securely using
 * server-side environment credentials.
 *
 * Input: { sourceImage, auditId, context, recommendations, prompt }
 * Output: { status: 'complete' | 'failed', imageUrl?: string, metadata: { ... } }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransformationRequestBody {
  sourceImage: string;
  auditId: string;
  context?: Record<string, unknown>;
  recommendations?: Array<Record<string, unknown>>;
  prompt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const requestId = `tr_edge_${Date.now().toString(36)}`;
  const timestamp = new Date().toISOString();

  try {
    const body: TransformationRequestBody = await req.json();
    const { sourceImage, auditId, prompt } = body;

    console.log(`[VertexTransformationService] Request ID: ${requestId} | Audit ID: ${auditId} | Timestamp: ${timestamp}`);

    if (!sourceImage) {
      return new Response(
        JSON.stringify({
          status: 'failed',
          errorMessage: 'Original uploaded reference image is required.',
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const rawBase64 = sourceImage.includes(',') ? sourceImage.split(',')[1] : sourceImage;
    const vertexKey = Deno.env.get('VERTEX_AI_KEY') || Deno.env.get('GEMINI_API_KEY');
    const projectId = Deno.env.get('GOOGLE_CLOUD_PROJECT_ID') || 'arcolab-5s-platform';
    const region = Deno.env.get('VERTEX_AI_REGION') || 'us-central1';

    // Vertex AI Image Editing Endpoint / Google Cloud Endpoint
    if (vertexKey) {
      try {
        const vertexUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/imagen-3.0-capability-001:predict?key=${vertexKey}`;

        console.log(`[VertexTransformationService] Invoking Vertex AI Image Editing endpoint for model imagen-3.0-capability-001...`);

        const vertexResponse = await fetch(vertexUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [
              {
                prompt,
                image: { bytesBase64Encoded: rawBase64 },
              },
            ],
            parameters: {
              sampleCount: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '4:3',
              editMode: 'inpainting-insert',
            },
          }),
        });

        if (vertexResponse.ok) {
          const vertexData = await vertexResponse.json();
          const b64 = vertexData?.predictions?.[0]?.bytesBase64Encoded;
          if (b64) {
            console.log(`[VertexTransformationService] Vertex AI Image Editing succeeded for request ${requestId}`);
            return new Response(
              JSON.stringify({
                status: 'complete',
                imageUrl: `data:image/jpeg;base64,${b64}`,
                metadata: {
                  auditId,
                  transformationId: requestId,
                  serviceVersion: '2.0.0',
                  imageModel: 'imagen-3.0-capability-001',
                  generationTimestamp: timestamp,
                  generationStatus: 'complete',
                },
              }),
              { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
        } else {
          const errText = await vertexResponse.text();
          console.warn(`[VertexTransformationService] Vertex AI endpoint returned ${vertexResponse.status}: ${errText}`);
        }
      } catch (err: any) {
        console.warn(`[VertexTransformationService] Vertex AI attempt failed:`, err?.message || err);
      }
    }

    // Backend Failure State — Explicit failure when Vertex AI credentials are missing or API fails
    return new Response(
      JSON.stringify({
        status: 'failed',
        errorMessage: 'AI Workplace Transformation Preview is currently unavailable.',
        metadata: {
          auditId,
          transformationId: requestId,
          generationStatus: 'failed',
          generationTimestamp: timestamp,
        },
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: any) {
    console.error(`[VertexTransformationService] Execution Error:`, err);
    return new Response(
      JSON.stringify({
        status: 'failed',
        errorMessage: 'AI Workplace Transformation Preview is currently unavailable.',
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
