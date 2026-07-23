/**
 * src/modules/audit/components/TransformationComparisonSlider.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Interactive Before/After Comparison Slider Component
 *
 * Renders an interactive draggable slider comparing the original workplace image
 * against the AI Workplace Transformation Preview.
 *
 * Refinements Applied:
 * - Refinement 1: Metadata is kept strictly internal (hidden from end-user UI).
 * - Refinement 2: Uses explicit "Illustrative Target Compliance" labeling to prevent
 *   implying a second formal audit was performed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, MoveHorizontal, AlertCircle } from "lucide-react";

interface Props {
  beforeImage: string;
  afterImage: string;
  beforePercentage: number;
  targetPercentage: number;
  targetRating: string;
  expectedImprovement: string;
}

export default function TransformationComparisonSlider({
  beforeImage,
  afterImage,
  beforePercentage,
  targetPercentage,
  targetRating,
  expectedImprovement,
}: Props) {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="space-y-4">
      {/* ── Status & Illustrative Badges Row ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider text-[11px]">
            Current Audit: {beforePercentage}%
          </span>
          <span className="text-muted-foreground font-bold">➔</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider text-[11px]">
            Illustrative Target: {targetPercentage}% ({targetRating.replace('_', ' ')})
          </span>
        </div>
        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold text-[11px]">
          <Sparkles className="h-3.5 w-3.5" />
          Expected Improvement: {expectedImprovement}
        </span>
      </div>

      {/* ── Interactive Comparison Slider Box ────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border/80 bg-[#1a1a1a] shadow-xl select-none cursor-col-resize touch-none group"
      >
        {/* 1. AFTER IMAGE (Full Background - Visible on Right Side) */}
        <div className="absolute inset-0 w-full h-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
          <img
            src={afterImage}
            alt="AI Workplace Transformation Preview"
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute top-4 right-4 z-10 bg-black/75 backdrop-blur-md text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-md">
            AFTER · ILLUSTRATIVE TARGET {targetPercentage}%
          </div>
        </div>

        {/* 2. BEFORE IMAGE (Clipped Layer - Visible on Left Side) */}
        <div
          className="absolute inset-0 w-full h-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
        >
          <img
            src={beforeImage}
            alt="Original Workplace Gemba"
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute top-4 left-4 z-10 bg-black/75 backdrop-blur-md text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-md">
            BEFORE · CURRENT {beforePercentage}%
          </div>
        </div>

        {/* 3. CENTER DRAGGABLE HANDLE DIVIDER */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.8)] z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-9 h-9 rounded-full bg-white text-slate-900 shadow-2xl flex items-center justify-center border-2 border-slate-900/10 transition-transform group-hover:scale-110">
            <MoveHorizontal className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* ── Official Mandatory Industrial Disclaimer ─────────────────────── */}
      <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 text-[11px] text-muted-foreground flex items-start gap-2.5 leading-relaxed">
        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground font-semibold">Disclaimer:</strong> This visualization is AI-generated for planning and communication purposes. It illustrates an expected workplace condition after implementing the recommended corrective actions and 5S principles. It is an illustrative conceptual forecast and does not constitute an actual post-implementation photograph or a second formal audit result.
        </p>
      </div>
    </div>
  );
}
