/**
 * src/modules/comparison/types/comparison.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for 5S Comparison Analysis TypeScript types.
 * Gemini-Only AI Architecture.
 */

// ── Per-pillar scores (0-100 after conversion from 0-20 scale) ────────────────
export interface FiveSScore {
  sort: number;
  setInOrder: number;
  shine: number;
  standardize: number;
  sustain: number;
}

// ── Natural-language explanations for each pillar ────────────────────────────
export interface ScoreExplanations {
  sort: string;
  setInOrder: string;
  shine: string;
  standardize: string;
  sustain: string;
}

// ── Top-level comparison analysis result (Gemini Vision contract) ─────────────
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
  comparisonSummary?: string;
}

// ── Analysis pipeline stages ──────────────────────────────────────────────────
export type AnalysisStage =
  | "idle"
  | "compressing"
  | "analyzing"
  | "saving"
  | "complete"
  | "error";

export interface AnalysisPipelineState {
  stage: AnalysisStage;
  progress: number;          // 0–100
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
    factors: ["Unnecessary item removal", "Clutter reduction", "Obstruction elimination", "Red tag discipline"],
  },
  {
    key: "setInOrder",
    label: "Set in Order",
    jp: "Seiton",
    desc: "Organising all remaining items systematically",
    icon: "📐",
    factors: ["Tool arrangement", "Designated storage indexing", "Shadow board placement", "Label visibility"],
  },
  {
    key: "shine",
    label: "Shine",
    jp: "Seiso",
    desc: "Cleaning and maintaining the workspace",
    icon: "✨",
    factors: ["Surface cleanliness", "Spill & dust removal", "Equipment hygiene", "Maintenance readiness"],
  },
  {
    key: "standardize",
    label: "Standardize",
    jp: "Seiketsu",
    desc: "Creating and enforcing workplace standards",
    icon: "📋",
    factors: ["Visual controls", "Color coding compliance", "Standardized layout", "Visual boundaries"],
  },
  {
    key: "sustain",
    label: "Sustain",
    jp: "Shitsuke",
    desc: "Maintaining discipline and continuous improvement",
    icon: "🔄",
    factors: ["Self-discipline", "Safety compliance", "Audit readiness", "Habitual 5S practice"],
  },
];
