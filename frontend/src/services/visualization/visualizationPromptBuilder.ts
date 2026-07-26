/**
 * src/services/visualization/visualizationPromptBuilder.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Module 3: Visualization Prompt Builder
 *
 * Consumes a VisualizationContext (centralised config + normalized actions) and
 * ScenePreservationPolicy to assemble a single deterministic image-editing prompt
 * stamped with visualizationPromptVersion.
 *
 * The prompt builder must never receive raw audit recommendations.
 * It only works with normalized PhysicalAction[] via VisualizationContext.
 *
 * Zero-Regression Guarantee: Pure function – no I/O, no audit engine calls.
 */

import type { VisualizationContext, PhysicalAction, PhysicalDomain } from './types';
import { buildScenePreservationConstraints, buildStrictScenePreservationConstraints } from './scenePreservationPolicy';

// ── Domain-specific preamble injected per action group ────────────────────────

const DOMAIN_PREAMBLE: Record<PhysicalDomain, string> = {
  CLEANING: 'Apply the following cleaning improvements',
  ORGANIZATION: 'Apply the following organization and sorting improvements',
  STORAGE: 'Apply the following storage arrangement improvements',
  VISUAL_MANAGEMENT: 'Apply the following visual management improvements',
  SAFETY: 'Apply the following safety compliance improvements',
  STANDARDIZATION: 'Apply the following standardization improvements',
};

/**
 * Groups physical actions by domain.
 */
function groupByDomain(actions: PhysicalAction[]): Map<PhysicalDomain, PhysicalAction[]> {
  const map = new Map<PhysicalDomain, PhysicalAction[]>();
  for (const action of actions) {
    const existing = map.get(action.domain) ?? [];
    map.set(action.domain, [...existing, action]);
  }
  return map;
}

/**
 * Builds the action section of the prompt, grouped by 5S domain.
 */
function buildActionBlock(actions: PhysicalAction[]): string {
  if (actions.length === 0) return 'No specific actions – maintain existing workplace state.';

  const grouped = groupByDomain(actions);
  const lines: string[] = [];

  for (const [domain, domainActions] of grouped.entries()) {
    lines.push(`\n${DOMAIN_PREAMBLE[domain]}:`);
    domainActions.forEach((a, i) => {
      lines.push(`  ${i + 1}. ${a.description}${a.targetArea ? ` (${a.targetArea})` : ''}`);
    });
  }

  return lines.join('\n');
}

/**
 * Assembles the full deterministic visualization prompt.
 * @param context  VisualizationContext containing all config, versioning, and actions
 * @param strict   When true, uses the stricter scene preservation (retry mode)
 */
export function buildVisualizationPrompt(
  context: VisualizationContext,
  strict = false
): string {
  const preservation = strict
    ? buildStrictScenePreservationConstraints()
    : buildScenePreservationConstraints();

  const actionBlock = buildActionBlock(context.actions);

  return [
    `ARCOLAB 5S WORKPLACE IMPROVEMENT VISUALIZATION`,
    `Prompt Version: ${context.promptVersion} | Scene Policy: ${context.scenePolicyVersion} | Context: ${context.contextVersion}`,
    '',
    `WORKSPACE CONTEXT: Zone: ${context.zoneName} | Industry: ${context.industry} | Type: ${context.workspaceType}`,
    '',
    'TASK INSTRUCTIONS:',
    'You are provided with an actual workplace photograph. Edit this photograph to accurately',
    'represent the expected workplace after implementing ONLY the approved 5S improvement actions.',
    'Do not recreate the workplace. Do not redesign the workplace. The original workplace',
    'must remain clearly recognizable.',
    '',
    '═══════════════════════════════════════════════',
    'APPROVED 5S IMPROVEMENT ACTIONS:',
    '═══════════════════════════════════════════════',
    actionBlock,
    '',
    '═══════════════════════════════════════════════',
    'SCENE PRESERVATION & RENDERING RULES:',
    '═══════════════════════════════════════════════',
    preservation,
    '',
    'RENDERING QUALITY REQUIREMENTS:',
    '- Photorealistic industrial appearance with realistic lighting, shadows, materials, and colors.',
    '- Zero artistic interpretation or decorative additions.',
    '- Modify ONLY objects directly affected by approved 5S recommendations.',
    '═══════════════════════════════════════════════',
  ].join('\n');
}
