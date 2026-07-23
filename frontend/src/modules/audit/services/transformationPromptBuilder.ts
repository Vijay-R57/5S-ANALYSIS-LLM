/**
 * src/modules/audit/services/transformationPromptBuilder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Refinement 3 — Prompt Builder
 *
 * Consumes the structured TransformationPlan from TransformationPlanner.
 * Generates explicit Image-to-Image editing instructions for image-conditioned models.
 * Preserves exact camera angle, room geometry, structural layout, and machinery identity.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { TransformationPlan } from './transformationPlanner';

export const PROMPT_BUILDER_VERSION = '3.0.0';

/**
 * Generates a deterministic hash for input objects to track cache validity.
 */
export function generateContentHash(input: any): string {
  const str = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

/**
 * Formats structured operations from the Transformation Plan into explicit AI instructions.
 */
function formatPlanOperations(plan: TransformationPlan): string {
  if (!plan.operations || plan.operations.length === 0) {
    return '1. Remove all loose clutter from the floor and surfaces.\n2. Clean all stainless steel tables, machines, and floor surfaces.\n3. Apply high-visibility yellow/black floor safety boundary striping.\n4. Align essential tools and containers neatly with visual labels.';
  }

  return plan.operations
    .map((op, i) => {
      return `${i + 1}. [OPERATION: ${op.operation} | PILLAR: ${op.pillar} | PRIORITY: ${op.priority.toUpperCase()}] Action: ${op.action} (Target Area: ${op.targetArea}, Resolving: "${op.resolvedDefect}"). Edit the image to show this improvement completed cleanly.`;
    })
    .join('\n');
}

/**
 * Builds a structured AI image-editing prompt from a Transformation Plan.
 */
export function buildTransformationPromptFromPlan(
  plan: TransformationPlan,
  sourceImageRef: string
): { prompt: string; promptVersion: string; recommendationHash: string; workspaceContextHash: string } {
  const area = plan.context.areaName || 'Workplace Gemba';
  const type = plan.context.workspaceType || 'General Industrial';
  const industry = plan.context.industry || 'Manufacturing';

  const recommendationHash = generateContentHash(plan.operations);
  const workspaceContextHash = generateContentHash(plan.context);

  const formattedOperations = formatPlanOperations(plan);

  const prompt = `
[PRIMARY INSTRUCTION: IMAGE-TO-IMAGE TRANSFORMATION]
Edit the provided uploaded workplace image (Reference ID: ${sourceImageRef}).
Do NOT generate a new workplace. Transform the SAME uploaded workplace image into an optimized, 5S-compliant version.

[STRICT PRESERVATION DIRECTIVES — DO NOT ALTER]
- Preserve exact camera angle, perspective, focal distance, and room dimensions.
- Preserve all structural walls, support columns, ceiling beams, windows, doors, and building architecture.
- Preserve all primary heavy machinery, stationary equipment, and heavy storage racks in their exact positions.
- Preserve lighting direction and architectural environment identity.

[WORKPLACE CONTEXT]
- Facility Area / Station: ${area}
- Workspace Type: ${type}
- Industry Sector: ${industry}

[STRUCTURED TRANSFORMATION PLAN OPERATIONS]
${formattedOperations}

[5S INDUSTRIAL PRINCIPLES]
1. SORT (Seiri): Eliminate all unorganized debris, abandoned materials, and unnecessary items.
2. SET IN ORDER (Seiton): Align essential tools and containers neatly inside marked storage zones with visual labels.
3. SHINE (Seiso): Clean all machines, tables, and floor surfaces until visibly spotless.
4. STANDARDIZE (Seiketsu): Apply high-visibility yellow/black floor safety boundary striping and aisle markings.
5. SUSTAIN (Shitsuke): Present an exemplary, enterprise-grade industrial 5S workplace standard.

[OUTPUT REQUIREMENTS]
- Style: Realistic photograph of the SAME workplace after 5S implementation.
- Preserve the visual identity of the user's original workplace.
`.trim();

  return {
    prompt,
    promptVersion: PROMPT_BUILDER_VERSION,
    recommendationHash,
    workspaceContextHash,
  };
}
