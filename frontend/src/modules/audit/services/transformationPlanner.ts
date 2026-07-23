/**
 * src/modules/audit/services/transformationPlanner.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Refinement 2 — Transformation Planner
 *
 * Converts audit recommendations into structured visual edit operations.
 * Separates raw audit findings from AI prompt construction.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type OperationType =
  | 'REMOVE_CLUTTER'
  | 'ALIGN_CONTAINERS'
  | 'ADD_SAFETY_STRIPING'
  | 'APPLY_LABELS'
  | 'CLEAN_SURFACES'
  | 'ORGANIZE_PALLETS'
  | 'CLEAR_WALKWAYS';

export interface VisualEditOperation {
  id: string;
  operation: OperationType;
  pillar: string;
  action: string;
  targetArea: string;
  priority: 'high' | 'medium' | 'low';
  resolvedDefect: string;
}

export interface TransformationPlan {
  planId: string;
  plannerVersion: string;
  createdAt: string;
  context: {
    areaName?: string;
    workspaceType?: string;
    industry?: string;
    department?: string;
  };
  operations: VisualEditOperation[];
}

export const PLANNER_VERSION = '1.0.0';

/**
 * Converts audit recommendations into a structured, deterministic Transformation Plan.
 */
export function planTransformation(
  recommendations: Array<{
    pillarName: string;
    problem: string;
    recommendation: string;
    priority?: string;
  }>,
  context: {
    areaName?: string;
    workspaceType?: string;
    industry?: string;
    department?: string;
  }
): TransformationPlan {
  const operations: VisualEditOperation[] = [];

  if (!recommendations || recommendations.length === 0) {
    operations.push(
      {
        id: 'op_default_1',
        operation: 'REMOVE_CLUTTER',
        pillar: 'SORT',
        action: 'Remove all unorganized debris, misplaced materials, and abandoned boxes from workspace',
        targetArea: 'Floor and Work Surfaces',
        priority: 'high',
        resolvedDefect: 'General workplace clutter',
      },
      {
        id: 'op_default_2',
        operation: 'ALIGN_CONTAINERS',
        pillar: 'SET_IN_ORDER',
        action: 'Align essential tools, trays, and chemical drums neatly within designated storage areas',
        targetArea: 'Storage Zone',
        priority: 'medium',
        resolvedDefect: 'Misplaced tools and containers',
      },
      {
        id: 'op_default_3',
        operation: 'CLEAN_SURFACES',
        pillar: 'SHINE',
        action: 'Clean equipment surfaces, stainless steel tables, and floor until spotless',
        targetArea: 'Equipment and Floor',
        priority: 'high',
        resolvedDefect: 'Surface dirt and stains',
      },
      {
        id: 'op_default_4',
        operation: 'ADD_SAFETY_STRIPING',
        pillar: 'STANDARDIZE',
        action: 'Apply high-visibility yellow/black floor safety boundary striping along walking aisles',
        targetArea: 'Aisle and Perimeter',
        priority: 'medium',
        resolvedDefect: 'Unmarked storage boundaries',
      }
    );
  } else {
    recommendations.forEach((r, index) => {
      const pillar = r.pillarName ? r.pillarName.toUpperCase() : 'SORT';
      let opType: OperationType = 'REMOVE_CLUTTER';

      const recLower = r.recommendation.toLowerCase();
      const probLower = r.problem.toLowerCase();

      if (recLower.includes('label') || probLower.includes('label')) {
        opType = 'APPLY_LABELS';
      } else if (recLower.includes('line') || recLower.includes('mark') || recLower.includes('stripe')) {
        opType = 'ADD_SAFETY_STRIPING';
      } else if (recLower.includes('clean') || recLower.includes('shine') || recLower.includes('dust')) {
        opType = 'CLEAN_SURFACES';
      } else if (recLower.includes('align') || recLower.includes('organize') || recLower.includes('arrange')) {
        opType = 'ALIGN_CONTAINERS';
      } else if (recLower.includes('pallet')) {
        opType = 'ORGANIZE_PALLETS';
      } else if (recLower.includes('clear') || recLower.includes('walkway') || recLower.includes('aisle')) {
        opType = 'CLEAR_WALKWAYS';
      }

      operations.push({
        id: `op_${index + 1}_${Date.now().toString(36)}`,
        operation: opType,
        pillar,
        action: r.recommendation,
        targetArea: context.areaName || 'Workstation',
        priority: (r.priority as 'high' | 'medium' | 'low') || 'medium',
        resolvedDefect: r.problem,
      });
    });
  }

  return {
    planId: `plan_${Date.now().toString(36)}`,
    plannerVersion: PLANNER_VERSION,
    createdAt: new Date().toISOString(),
    context,
    operations,
  };
}
