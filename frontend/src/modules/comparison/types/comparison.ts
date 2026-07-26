/**
 * src/modules/comparison/types/comparison.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TypeScript contracts for the 5S Comparison & Lean Maintenance module.
 * Relocated from Arcolab/frontend/src/types/analysis.ts — paths adapted only.
 * Business logic is unchanged.
 */

// ── Per-pillar scores (0-100) ─────────────────────────────────────────────────
export interface FiveSScore {
  sort: number;
  setInOrder: number;
  shine: number;
  standardize: number;
  sustain: number;
}

// ── Natural-language explanations for each pillar ─────────────────────────────
export interface ScoreExplanations {
  sort: string;
  setInOrder: string;
  shine: string;
  standardize: string;
  sustain: string;
}

// ── Top-level comparison result (matches edge function response) ──────────────
export interface AnalysisData {
  overview: string;
  beforeScores: FiveSScore;
  afterScores: FiveSScore;
  beforeExplanations: ScoreExplanations;
  afterExplanations: ScoreExplanations;
  recommendations: string[];
  improvements: string[];
  rootCauseObservations?: string[];
  safetyRecommendations?: string[];
  leanMaintenanceScore: number;
  leanMaintenanceScoreAfter?: number;
  leanMaintenanceExplanation: string;
  scoringMethod?: string;
  rawScoringMethod?: string;
  // Optional CV metrics (unused by Gemini pipeline but kept for schema compat)
  beforeMetrics?: Record<string, number>;
  afterMetrics?: Record<string, number>;
}

// ── Analysis pipeline stages (for progress UX) ───────────────────────────────
export type AnalysisStage =
  | "idle"
  | "compressing"
  | "analyzing"
  | "saving"
  | "complete"
  | "error";

export interface AnalysisPipelineState {
  stage: AnalysisStage;
  progress: number;   // 0–100
  message: string;
  retryCount: number;
}

// ── Pillar metadata ───────────────────────────────────────────────────────────
export interface PillarMeta {
  key: keyof FiveSScore;
  label: string;
  jp: string;
  desc: string;
  icon: string;
  factors: string[];
}

export const PILLAR_META: PillarMeta[] = [
  {
    key: "sort",
    label: "Sort",
    jp: "Seiri",
    desc: "Removing unnecessary items from the workspace",
    icon: "🗂️",
    factors: ["Clutter count", "Clutter density", "Obstruction ratio", "Unused material presence"],
  },
  {
    key: "setInOrder",
    label: "Set in Order",
    jp: "Seiton",
    desc: "Organising all remaining items systematically",
    icon: "📐",
    factors: ["Object alignment", "Spacing consistency", "Edge alignment", "Organisation symmetry"],
  },
  {
    key: "shine",
    label: "Shine",
    jp: "Seiso",
    desc: "Cleaning and maintaining the workspace",
    icon: "✨",
    factors: ["Brightness consistency", "Dirt proxy detection", "Texture irregularity", "Edge cleanliness"],
  },
  {
    key: "standardize",
    label: "Standardize",
    jp: "Seiketsu",
    desc: "Creating and enforcing workplace standards",
    icon: "📋",
    factors: ["Visual consistency", "Color uniformity", "Workplace std deviation", "Visual compliance"],
  },
  {
    key: "sustain",
    label: "Sustain",
    jp: "Shitsuke",
    desc: "Maintaining discipline and continuous improvement",
    icon: "🔄",
    factors: ["Historical consistency", "Compliance trends", "Previous audit comparison", "Discipline index"],
  },
];
