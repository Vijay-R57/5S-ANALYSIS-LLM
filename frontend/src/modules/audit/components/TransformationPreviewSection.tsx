/**
 * src/modules/audit/components/TransformationPreviewSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Workplace Transformation Preview Web Section
 *
 * Hosts the Post-Audit Enhancement Service in the web report.
 * Renders loading progress, cache invalidation notices, interactive slider,
 * and graceful failure handling.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import {
  generateTransformationPreview,
  TransformationPreviewResult,
  getCachedTransformationPreview,
} from "../services/workplaceTransformationService";
import { WorkplaceContextInput, RecommendationInput } from "../services/transformationPromptBuilder";
import TransformationComparisonSlider from "./TransformationComparisonSlider";
import { Card, CardHeader, CardBody, ds } from "@/design-system";

interface Props {
  auditId: string;
  beforeImage: string;
  currentScore: number;
  maxScore: number;
  currentPercentage: number;
  rating: string;
  context: WorkplaceContextInput;
  recommendations: RecommendationInput[];
}

export default function TransformationPreviewSection({
  auditId,
  beforeImage,
  currentScore,
  maxScore,
  currentPercentage,
  rating,
  context,
  recommendations,
}: Props) {
  const [result, setResult] = useState<TransformationPreviewResult | null>(() =>
    getCachedTransformationPreview(auditId)
  );
  const [loading, setLoading] = useState(!result);
  const [statusMsg, setStatusMsg] = useState("Generating AI Workplace Transformation Preview...");

  const runService = useCallback(async () => {
    setLoading(true);
    setStatusMsg("Analyzing recommendations & workplace context...");

    try {
      await new Promise((r) => setTimeout(r, 400));
      setStatusMsg("Rendering photorealistic 5S workplace visualization...");

      const res = await generateTransformationPreview(
        auditId,
        currentScore,
        maxScore,
        currentPercentage,
        context,
        recommendations,
        beforeImage
      );

      setResult(res);
    } catch (err) {
      console.error("Transformation preview generation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [auditId, currentScore, maxScore, currentPercentage, context, recommendations, beforeImage]);

  useEffect(() => {
    runService();
  }, [runService]);

  return (
    <Card className={ds.print.breakAvoid}>
      <CardHeader
        badge={
          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-primary/20">
            <Sparkles className="h-3 w-3" />
            AI Conceptual Visualization
          </span>
        }
      >
        <span className="flex items-center gap-2">
          <span>AI Workplace Transformation Preview</span>
        </span>
      </CardHeader>

      <CardBody className="space-y-4">
        <p className={ds.type.bodyMuted}>
          Explore expected workplace conditions after implementing AI-generated 5S recommendations and corrective actions. Drag the slider to compare baseline Gemba against the conceptual target state.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border border-border rounded-2xl space-y-3 text-center min-h-[280px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">{statusMsg}</p>
              <p className="text-[11px] text-muted-foreground">
                Asynchronous Post-Audit Enhancement Service in progress.
              </p>
            </div>
          </div>
        ) : result && result.status === "complete" ? (
          <TransformationComparisonSlider
            beforeImage={beforeImage}
            afterImage={result.transformedImageUrl}
            beforePercentage={currentPercentage}
            targetPercentage={result.illustrativeTargetPercentage}
            targetRating={result.targetRating}
            expectedImprovement={result.expectedImprovement}
          />
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs">
            <div className="flex items-start gap-2.5 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">AI Workplace Transformation Preview is unavailable.</p>
                <p className="text-[11px] opacity-90">
                  {result?.errorMessage || 'Image Transformation capability is not supported by the configured AI model.'}
                </p>
              </div>
            </div>
            <button
              onClick={runService}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-foreground font-semibold transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Visualization</span>
            </button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
