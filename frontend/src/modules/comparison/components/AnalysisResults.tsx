/**
 * src/modules/comparison/components/AnalysisResults.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full results display panel: scores, explanations, recommendations, PDF export.
 * Relocated from Arcolab/frontend/src/components/AnalysisResults.tsx
 * Adaptations:
 *  • Import paths updated to comparison module types and components
 *  • PDF title updated to "5S Comparison Report"
 *  • Logic: UNCHANGED
 */

import { Download, CheckCircle, AlertTriangle, TrendingUp, Clock, Wrench, ShieldCheck, Info, Search } from "lucide-react";
import jsPDF from "jspdf";
import ScoreExplanationCard from "@/modules/comparison/components/ScoreExplanationCard";
import BeforeAfterComparison from "@/modules/comparison/components/BeforeAfterComparison";
import type { AnalysisData, FiveSScore, ScoreExplanations } from "@/modules/comparison/types/comparison";
import { PILLAR_META } from "@/modules/comparison/types/comparison";

export type { AnalysisData, FiveSScore, ScoreExplanations };

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-warning";
  return "text-destructive";
};

const getBarBg = (score: number) => {
  if (score >= 80) return "bg-primary";
  if (score >= 60) return "bg-warning";
  return "bg-destructive";
};

interface Props {
  data: AnalysisData;
  beforeImage: string;
  afterImage: string;
  analysisTimestamp?: string;
  beforeUploadTime?: string;
  afterUploadTime?: string;
}

const AnalysisResults = ({ data, beforeImage, afterImage, analysisTimestamp, beforeUploadTime, afterUploadTime }: Props) => {
  const scoringMethod = data.scoringMethod || "Gemini Vision";

  const avgBefore = Math.round(Object.values(data.beforeScores).reduce((a, b) => a + b, 0) / 5);
  const avgAfter = Math.round(Object.values(data.afterScores).reduce((a, b) => a + b, 0) / 5);
  const timestamp = analysisTimestamp || new Date().toISOString();

  const formatDT = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const checkPage = (heightNeeded: number) => {
      if (y + heightNeeded > 275) {
        doc.addPage();
        y = 20;
      }
    };

    const addParagraph = (
      text: string,
      fontSize = 10,
      fontStyle = "normal",
      textColor = [60, 60, 60],
      indent = 15,
      spacing = 5
    ) => {
      doc.setFont("times", fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const lines = doc.splitTextToSize(text, pageWidth - indent - 15);
      lines.forEach((line: string) => {
        checkPage(5);
        doc.text(line, indent, y);
        y += spacing;
      });
    };

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 71);
    doc.text("ARCOLAB — 5S Comparison Analysis Report", pageWidth / 2, y, { align: "center" });
    y += 10;
    doc.setDrawColor(37, 99, 71);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    // Timestamps
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Analysis Date: ${formatDT(timestamp)}`, 15, y);
    y += 5;
    if (beforeUploadTime) {
      doc.text(`Before Image Uploaded: ${formatDT(beforeUploadTime)}`, 15, y);
      y += 5;
    }
    if (afterUploadTime) {
      doc.text(`After Image Uploaded: ${formatDT(afterUploadTime)}`, 15, y);
      y += 5;
    }
    doc.text(`Scoring Engine: ${scoringMethod}`, 15, y);
    y += 12;

    // Overview
    checkPage(15);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text("Analysis Overview", 15, y);
    y += 7;
    addParagraph(data.overview, 10, "normal", [60, 60, 60], 15, 5);
    y += 4;

    // Lean Maintenance Score
    checkPage(15);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text("Lean Maintenance Score", 15, y);
    y += 7;
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 71);
    doc.text(`Before: ${data.leanMaintenanceScore}%  →  After: ${data.leanMaintenanceScoreAfter ?? data.leanMaintenanceScore}%`, 15, y);
    y += 6;
    if (data.leanMaintenanceExplanation) {
      addParagraph(data.leanMaintenanceExplanation, 9, "normal", [60, 60, 60], 15, 4.5);
      y += 4;
    }

    // 5S Scores
    checkPage(20);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text("5S Category Scores", 15, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Category", 15, y);
    doc.text("Before", 85, y);
    doc.text("After", 105, y);
    doc.text("Change", 125, y);
    y += 6;

    PILLAR_META.forEach((cat) => {
      checkPage(25);
      const before = data.beforeScores[cat.key];
      const after = data.afterScores[cat.key];
      doc.setFont("times", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`${cat.label} (${cat.jp})`, 15, y);
      doc.setFont("times", "normal");
      doc.text(`${before}%`, 85, y);
      doc.text(`${after}%`, 105, y);
      const delta = Math.round(after - before);
      const deltaStr = delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : `±0%`;
      doc.setTextColor(delta >= 0 ? 37 : 180, delta >= 0 ? 99 : 30, delta >= 0 ? 71 : 30);
      doc.text(deltaStr, 125, y);
      y += 5;

      if (data.beforeExplanations?.[cat.key]) {
        addParagraph(`Before: ${data.beforeExplanations[cat.key]}`, 8, "normal", [100, 100, 100], 18, 3.5);
        y += 1;
      }
      if (data.afterExplanations?.[cat.key]) {
        addParagraph(`After: ${data.afterExplanations[cat.key]}`, 8, "normal", [100, 100, 100], 18, 3.5);
        y += 1;
      }
      y += 2;
    });

    checkPage(15);
    y += 3;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    const overallDelta = Math.round(avgAfter - avgBefore);
    const overallDeltaStr = overallDelta > 0 ? `+${overallDelta}%` : overallDelta < 0 ? `${overallDelta}%` : `±0%`;
    doc.text(`Overall Score: ${avgBefore}% → ${avgAfter}% (${overallDeltaStr})`, 15, y);
    y += 12;

    // Recommendations
    checkPage(20);
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(40, 40, 40);
    doc.text("Recommendations", 15, y);
    y += 8;
    data.recommendations.forEach((rec) => {
      addParagraph(`• ${rec}`, 10, "normal", [60, 60, 60], 15, 5);
      y += 2;
    });

    // Improvements
    if (data.improvements.length > 0) {
      y += 4;
      checkPage(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text("Key Improvements Observed", 15, y);
      y += 8;
      data.improvements.forEach((imp) => {
        addParagraph(`• ${imp}`, 10, "normal", [60, 60, 60], 15, 5);
        y += 2;
      });
    }

    // Root Cause Observations
    if (data.rootCauseObservations && data.rootCauseObservations.length > 0) {
      y += 4;
      checkPage(20);
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text("Root Cause Observations", 15, y);
      y += 8;
      data.rootCauseObservations.forEach((obs) => {
        addParagraph(`• ${obs}`, 10, "normal", [60, 60, 60], 15, 5);
        y += 2;
      });
    }

    // Safety Recommendations
    if (data.safetyRecommendations && data.safetyRecommendations.length > 0) {
      y += 4;
      checkPage(20);
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text("Safety Compliance Recommendations", 15, y);
      y += 8;
      data.safetyRecommendations.forEach((sec) => {
        addParagraph(`• ${sec}`, 10, "normal", [60, 60, 60], 15, 5);
        y += 2;
      });
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("times", "italic");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("© 2026 ARCOLAB — 5S Comparison Analysis", pageWidth / 2, 287, { align: "center" });
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, 287, { align: "right" });
    }

    doc.save("ArcoLabs-5S-Comparison-Report.pdf");
  };

  return (
    <div className="space-y-8">
      {/* Timestamp */}
      <div className="bg-muted/50 rounded-lg border border-border px-5 py-3 space-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
          <span>Comparison performed: <span className="font-semibold text-foreground">{formatDT(timestamp)}</span></span>
        </div>
        {beforeUploadTime &&
        <div className="flex items-center gap-2 pl-6">
            <span>Before image uploaded: <span className="font-semibold text-foreground">{formatDT(beforeUploadTime)}</span></span>
          </div>
        }
        {afterUploadTime &&
        <div className="flex items-center gap-2 pl-6">
            <span>After image uploaded: <span className="font-semibold text-foreground">{formatDT(afterUploadTime)}</span></span>
          </div>
        }
      </div>

      {/* Overview */}
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
        <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Analysis Overview
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.overview}</p>
      </div>

      {/* Lean Maintenance Score */}
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-heading font-semibold text-card-foreground">Lean Maintenance Score</h3>
        </div>
        <div className="flex items-end gap-6 mb-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Before</p>
            <span className={`text-3xl font-bold ${getScoreColor(data.leanMaintenanceScore)}`}>
              {data.leanMaintenanceScore}%
            </span>
          </div>
          <span className="text-2xl text-muted-foreground mb-1">→</span>
          {data.leanMaintenanceScoreAfter !== undefined && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">After</p>
              <span className={`text-3xl font-bold ${getScoreColor(data.leanMaintenanceScoreAfter)}`}>
                {data.leanMaintenanceScoreAfter}%
              </span>
            </div>
          )}
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full ${getBarBg(data.leanMaintenanceScoreAfter ?? data.leanMaintenanceScore)}`}
            style={{ width: `${data.leanMaintenanceScoreAfter ?? data.leanMaintenanceScore}%` }} />
        </div>
        {data.leanMaintenanceExplanation &&
        <div className="bg-muted/40 rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{data.leanMaintenanceExplanation}</span>
            </p>
          </div>
        }
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Lean Maintenance</span> focuses on preventing equipment problems, keeping machines clean and organised, reducing downtime, and improving overall efficiency through TPM (Total Productive Maintenance) practices.
          </p>
        </div>
      </div>

      {/* Before/After Comparison Slider */}
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
        <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Before vs After Comparison
        </h3>
        <BeforeAfterComparison
          beforeImage={beforeImage}
          afterImage={afterImage}
          beforeScore={avgBefore}
          afterScore={avgAfter}
        />
      </div>

      {/* 5S Scores with expandable explanation cards */}
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
        <h3 className="text-lg font-heading font-semibold text-card-foreground mb-6">5S Category Scores</h3>
        <div className="space-y-3">
          {PILLAR_META.map((pillar) => (
            <ScoreExplanationCard
              key={pillar.key}
              pillar={pillar}
              beforeScore={data.beforeScores[pillar.key]}
              afterScore={data.afterScores[pillar.key]}
              beforeExplanation={data.beforeExplanations?.[pillar.key]}
              afterExplanation={data.afterExplanations?.[pillar.key]}
              defaultExpanded={false}
            />
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
          <span className="font-heading font-semibold text-foreground">Overall Score</span>
          <div className="flex items-center gap-3">
            <span className={`text-xl font-bold ${getScoreColor(avgBefore)}`}>{avgBefore}%</span>
            <span className="text-muted-foreground">→</span>
            <span className={`text-xl font-bold ${getScoreColor(avgAfter)}`}>{avgAfter}%</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
        <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Recommendations
        </h3>
        <ul className="space-y-3">
          {data.recommendations.map((rec, i) =>
          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">{i + 1}</span>
              {rec}
            </li>
          )}
        </ul>
      </div>

      {/* Key Improvements */}
      {data.improvements.length > 0 &&
      <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
          <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Key Improvements Observed
          </h3>
          <ul className="space-y-2">
            {data.improvements.map((imp, i) =>
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                {imp}
              </li>
          )}
          </ul>
        </div>
      }

      {/* Root Cause Observations */}
      {data.rootCauseObservations && data.rootCauseObservations.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
          <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Search className="h-5 w-5 text-amber-500" />
            Root Cause Observations
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Lean engineering analysis of underlying factors contributing to identified shop-floor wastes.
          </p>
          <ul className="space-y-3">
            {data.rootCauseObservations.map((obs, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Recommendations */}
      {data.safetyRecommendations && data.safetyRecommendations.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
          <h3 className="text-lg font-heading font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Safety Compliance Recommendations
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Critical safety measures aligned with occupational standards to eliminate occupational hazards in the Gemba.
          </p>
          <ul className="space-y-3">
            {data.safetyRecommendations.map((sec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                {sec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Download */}
      <button
        onClick={downloadPdf}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
        <Download className="h-5 w-5" />
        Download Comparison PDF Report
      </button>
    </div>
  );
};

export default AnalysisResults;
