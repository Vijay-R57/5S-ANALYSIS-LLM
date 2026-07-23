import { Download, CheckCircle, AlertTriangle, TrendingUp, Clock, Wrench, ShieldCheck, Info, Search, Sparkles } from "lucide-react";
import jsPDF from "jspdf";
import ComparisonScoreExplanationCard from "./ComparisonScoreExplanationCard";
import BeforeAfterComparison from "./BeforeAfterComparison";
import { PILLAR_META } from "../types/comparison";
import type { AnalysisData, FiveSScore, ScoreExplanations } from "../types/comparison";

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

export default function ComparisonAnalysisResults({ data, beforeImage, afterImage, analysisTimestamp, beforeUploadTime, afterUploadTime }: Props) {
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
    doc.text("ARCOLAB — 5S Workplace Analysis Report", pageWidth / 2, y, { align: "center" });
    y += 10;
    doc.setDrawColor(37, 99, 71);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    // Timestamps
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Analysis Date: ${formatDT(timestamp)} | Scoring Engine: Gemini Vision AI`, 15, y);
    y += 5;
    if (beforeUploadTime) {
      doc.text(`Before Image Uploaded: ${formatDT(beforeUploadTime)}`, 15, y);
      y += 5;
    }
    if (afterUploadTime) {
      doc.text(`After Image Uploaded: ${formatDT(afterUploadTime)}`, 15, y);
      y += 5;
    }
    y += 8;

    // Executive Summary Box
    doc.setFillColor(245, 247, 246);
    doc.setDrawColor(220, 225, 222);
    doc.rect(15, y, pageWidth - 30, 28, "FD");
    
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 71);
    doc.text("EXECUTIVE SCORE SUMMARY", 20, y + 8);

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(`Before Score: ${avgBefore}%   -->   After Score: ${avgAfter}%`, 20, y + 18);

    const netChange = avgAfter - avgBefore;
    doc.setFontSize(10);
    if (netChange >= 0) {
      doc.setTextColor(37, 99, 71);
      doc.text(`Net Improvement: +${netChange}%`, pageWidth - 65, y + 18);
    } else {
      doc.setTextColor(180, 40, 40);
      doc.text(`Net Regression: ${netChange}%`, pageWidth - 65, y + 18);
    }
    y += 36;

    // 5S Pillar Breakdown
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 71);
    doc.text("1. Detailed 5S Pillar Evaluation", 15, y);
    y += 8;

    PILLAR_META.forEach((p) => {
      checkPage(35);
      const bScore = data.beforeScores[p.key];
      const aScore = data.afterScores[p.key];
      const bExp = data.beforeExplanations?.[p.key] || "";
      const aExp = data.afterExplanations?.[p.key] || "";

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(`${p.label} (${p.jp}) — Before: ${bScore}% | After: ${aScore}%`, 15, y);
      y += 6;

      if (bExp) {
        addParagraph(`Before State: ${bExp}`, 9, "italic", [100, 100, 100], 20, 4);
      }
      if (aExp) {
        addParagraph(`After State: ${aExp}`, 9, "normal", [40, 40, 40], 20, 4);
      }
      y += 4;
    });

    // Overview & Comparative Observations
    checkPage(30);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 71);
    doc.text("2. Comparative Observations & Overview", 15, y);
    y += 8;
    addParagraph(data.overview, 10, "normal", [50, 50, 50], 15, 5);
    y += 6;

    // Improvements
    if (data.improvements && data.improvements.length > 0) {
      checkPage(25);
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 71);
      doc.text("Key Improvements Identified:", 15, y);
      y += 6;
      data.improvements.forEach((imp) => {
        addParagraph(`• ${imp}`, 9.5, "normal", [40, 40, 40], 20, 4.5);
      });
      y += 4;
    }

    // Recommendations
    if (data.recommendations && data.recommendations.length > 0) {
      checkPage(25);
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 71);
      doc.text("Actionable Corrective Recommendations:", 15, y);
      y += 6;
      data.recommendations.forEach((rec) => {
        addParagraph(`• ${rec}`, 9.5, "normal", [40, 40, 40], 20, 4.5);
      });
      y += 4;
    }

    // Safety Recommendations
    if (data.safetyRecommendations && data.safetyRecommendations.length > 0) {
      checkPage(25);
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(180, 80, 20);
      doc.text("Safety & Hazard Elimination Recommendations:", 15, y);
      y += 6;
      data.safetyRecommendations.forEach((safeRec) => {
        addParagraph(`• ${safeRec}`, 9.5, "normal", [40, 40, 40], 20, 4.5);
      });
      y += 4;
    }

    // Lean Maintenance
    checkPage(30);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 71);
    doc.text("3. Autonomous Lean Maintenance Assessment", 15, y);
    y += 8;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Lean Maintenance Index: ${data.leanMaintenanceScore}%`, 15, y);
    y += 6;
    if (data.leanMaintenanceExplanation) {
      addParagraph(data.leanMaintenanceExplanation, 9.5, "normal", [50, 50, 50], 15, 5);
    }

    // Save
    doc.save(`ARCOLAB_5S_Comparison_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const deltaOverall = avgAfter - avgBefore;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Top Header / Download Bar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">ARCOLAB 5S Audit</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-medium">Comparison & Lean Maintenance</span>
          </div>
          <h2 className="text-xl font-heading font-bold text-foreground">
            Workplace 5S Analysis Report
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {formatDT(timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Engine: {data.scoringMethod || "Gemini Vision AI"}
            </span>
          </div>
        </div>

        <button
          onClick={downloadPdf}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Export PDF Report
        </button>
      </div>

      {/* ── Side-by-Side Image Comparison Slider ──────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Visual Gemba Before / After Comparison
        </h3>
        <BeforeAfterComparison
          beforeImage={beforeImage}
          afterImage={afterImage}
          beforeScore={avgBefore}
          afterScore={avgAfter}
        />
      </div>

      {/* ── Executive Summary Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Before Score */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Before Audit Score
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-bold ${getScoreColor(avgBefore)}`}>{avgBefore}%</span>
            <span className="text-xs text-muted-foreground">Baseline</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getBarBg(avgBefore)}`} style={{ width: `${avgBefore}%` }} />
          </div>
        </div>

        {/* After Score */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            After Audit Score
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-bold ${getScoreColor(avgAfter)}`}>{avgAfter}%</span>
            <span className="text-xs text-primary font-semibold">Post-Improvement</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getBarBg(avgAfter)}`} style={{ width: `${avgAfter}%` }} />
          </div>
        </div>

        {/* Net Delta */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Net 5S Improvement
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-3xl font-bold ${deltaOverall >= 0 ? "text-primary" : "text-destructive"}`}>
              {deltaOverall >= 0 ? "+" : ""}{deltaOverall}%
            </span>
            <span className="text-xs text-muted-foreground">
              {deltaOverall >= 0 ? "Positive Progress" : "Regression Detected"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>Measured across all 5 Pillars</span>
          </div>
        </div>
      </div>

      {/* ── Pillar Breakdown Section ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Pillar-by-Pillar Comparison Evaluation
          </h3>
          <span className="text-xs text-muted-foreground">Click card to view Gemini reasoning</span>
        </div>

        <div className="space-y-3">
          {PILLAR_META.map((p) => (
            <ComparisonScoreExplanationCard
              key={p.key}
              pillar={p}
              beforeScore={data.beforeScores[p.key]}
              afterScore={data.afterScores[p.key]}
              beforeExplanation={data.beforeExplanations?.[p.key]}
              afterExplanation={data.afterExplanations?.[p.key]}
            />
          ))}
        </div>
      </div>

      {/* ── Overview Narrative ────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Comparative Executive Narrative
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.overview}</p>
      </div>

      {/* ── Improvements & Recommendations Grid ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Improvements */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Verified Improvements
          </h3>
          <ul className="space-y-2">
            {data.improvements?.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Actionable Corrective Steps
          </h3>
          <ul className="space-y-2">
            {data.recommendations?.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Safety Recommendations (if present) ──────────────────────────── */}
      {data.safetyRecommendations && data.safetyRecommendations.length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Safety & Hazard Elimination Directives
          </h3>
          <ul className="space-y-2">
            {data.safetyRecommendations.map((safeRec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0 mt-0.5" />
                <span>{safeRec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Autonomous Lean Maintenance Section ───────────────────────────── */}
      <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-foreground">
                Autonomous Lean Maintenance Assessment
              </h3>
              <p className="text-xs text-muted-foreground">
                Evaluates equipment readiness, lubrication standards, and preventive hygiene.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-lg shadow-xs">
            <span className="text-xs font-medium text-muted-foreground">Maintenance Index:</span>
            <span className={`text-base font-bold ${getScoreColor(data.leanMaintenanceScore)}`}>
              {data.leanMaintenanceScore}%
            </span>
          </div>
        </div>

        {data.leanMaintenanceExplanation && (
          <p className="text-xs text-muted-foreground leading-relaxed bg-background/60 p-4 rounded-lg border border-border/60">
            {data.leanMaintenanceExplanation}
          </p>
        )}
      </div>
    </div>
  );
}
