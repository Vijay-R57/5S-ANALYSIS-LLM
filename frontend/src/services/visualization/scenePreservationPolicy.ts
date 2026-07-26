/**
 * src/services/visualization/scenePreservationPolicy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Scene Preservation Policy (v1.0)
 *
 * Single source of truth for ALL preservation constraints injected into the
 * Visualization Prompt Builder. Independently versioned so future policy
 * revisions do not require redesigning the prompt builder.
 *
 * Zero-Regression Guarantee: NEW file – no existing module is modified.
 */

/** Version identifier for this policy – recorded in execution metadata */
export const SCENE_POLICY_VERSION = '1.0';

/** Elements that must remain visually unchanged in the generated image */
export const SCENE_MUST_PRESERVE = [
  'camera angle and viewpoint',
  'perspective and depth of field',
  'room geometry and spatial layout',
  'walls, ceiling, doors, and windows',
  'identity and position of permanent machinery and equipment',
  'background industrial infrastructure',
  'natural and artificial lighting conditions',
  'floor plan dimensions and proportions',
] as const;

/** Elements that the prompt and provider must NEVER introduce */
export const SCENE_FORBIDDEN_CHANGES = [
  'architectural redesign or new building structures',
  'new machinery or permanent equipment not present in the original',
  'removal of permanent structural elements',
  'change in camera viewpoint or perspective',
  'room size or spatial dimension modification',
  'decorative or aesthetic elements unrelated to 5S recommendations',
  'futuristic or unrealistic industrial environments',
  'computer-generated perfection that does not match industrial reality',
] as const;

/** Realism constraints injected into every visualization prompt */
export const SCENE_REALISM_REQUIREMENTS = [
  'photorealistic and industrially authentic result',
  'achievable and practical post-5S improvement appearance',
  'normal industrial wear, texture, and maintenance level',
  'consistent with the original lighting and colour temperature',
  'changes limited strictly to approved 5S recommendation actions',
] as const;

/**
 * Returns the full scene preservation policy as a structured string block
 * ready for injection into the Visualization Prompt Builder.
 */
export function buildScenePreservationConstraints(): string {
  const preserveList = SCENE_MUST_PRESERVE.map((s) => `  • ${s}`).join('\n');
  const forbidList = SCENE_FORBIDDEN_CHANGES.map((s) => `  ✗ ${s}`).join('\n');
  const realismList = SCENE_REALISM_REQUIREMENTS.map((s) => `  ✓ ${s}`).join('\n');

  return [
    `SCENE PRESERVATION POLICY v${SCENE_POLICY_VERSION}`,
    '',
    'MUST PRESERVE:',
    preserveList,
    '',
    'MUST NOT CHANGE:',
    forbidList,
    '',
    'REALISM REQUIREMENTS:',
    realismList,
  ].join('\n');
}

/**
 * Returns a stricter variant of the preservation constraints for use
 * on the single retry attempt after a technical validation failure.
 */
export function buildStrictScenePreservationConstraints(): string {
  return [
    buildScenePreservationConstraints(),
    '',
    'STRICT MODE (retry): Preserve the original scene with maximum fidelity.',
    'Apply only the minimum visual changes described in the action list.',
    'Any deviation from the original room structure is strictly prohibited.',
  ].join('\n');
}
