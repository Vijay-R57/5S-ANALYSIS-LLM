/**
 * src/components/AnalysisResults.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCOLAB 5S Workplace Audit Report Dashboard.
 * Uses the global ARCOLAB Design System for consistent layout, spacing,
 * typography, and PDF rendering standards.
 */

import React, { useState } from 'react';
import { Download, Terminal, Sparkles } from 'lucide-react';
import { mapAnalysisResultToAuditResult } from '@/modules/audit/utils/auditMapper';
import AuditProgressStepper from '@/modules/audit/components/AuditProgressStepper';
import AuditScoreCard from '@/modules/audit/components/AuditScoreCard';
import PillarCard from '@/modules/audit/components/PillarCard';
import type { AuditPillar } from '@/modules/audit/constants/pillars';
import PillarAssessment from '@/modules/audit/components/PillarAssessment';
import RecommendationCard from '@/modules/audit/components/RecommendationCard';
import RadarScoreChart from '@/modules/audit/components/RadarScoreChart';
import AuditSummaryCard from '@/modules/audit/components/AuditSummaryCard';
import AuditTimelineComponent from '@/modules/audit/components/AuditTimeline';
import type { AuditAnalysisResult, AuditTimeline } from '@/types/analysis';
import TransformationPreviewSection from '@/modules/audit/components/TransformationPreviewSection';
import { getCachedTransformationPreview } from '@/modules/audit/services/workplaceTransformationService';
import { jsPDF } from 'jspdf';
import {
  ds,
  PDF,
  contentWidth,
  AuditPage,
  Section,
  SectionHeader,
  Card,
  CardHeader,
  CardBody,
  ReportHeader,
  MetaGrid,
} from '@/design-system';

interface Props {
  data: AuditAnalysisResult;
  workplaceImage: string;
  analysisTimestamp?: string;
  imageQualityScore?: number | null;
  imageQualityLevel?: string | null;
  timeline?: AuditTimeline | null;
}

export default function AnalysisResults({
  data,
  workplaceImage,
  analysisTimestamp,
  imageQualityScore = null,
  imageQualityLevel = null,
  timeline = null,
}: Props) {
  // Deterministic scoring safety check
  const scoringMethod = data.scoringMethod || "AI Audit (Structured Questionnaire)";
  if (
    scoringMethod.toLowerCase().includes("fallback") ||
    scoringMethod.toLowerCase().includes("gemini")
  ) {
    throw new Error("Deterministic scoring violation detected.");
  }

  const [devMode, setDevMode] = useState(false);

  // Map incoming database AI response model to future-compatible AuditResult contract
  const auditResult = mapAnalysisResultToAuditResult(data, analysisTimestamp);
  const { overallScore, overallMaxScore, overallPercentage, overallRating, pillars, recommendations, summary, areaInfo } = auditResult;

  // Enhance summary with image quality fields passed from validation panel
  const enhancedSummary = {
    ...summary,
    imageQualityScore,
    imageQualityLevel,
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // ── PDF design-system tokens ──────────────────────────────────────────────
    const margin = PDF.margin;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const cw = contentWidth(pageWidth);   // design-system helper
    let y = margin;

    // ── PDF Helpers (design-system driven) ──────────────────────────────────
    const addPageHeader = () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF.font.runningHead);
      doc.setTextColor(...PDF.color.muted);
      doc.text('ARCOLAB 5S WORKPLACE AUDIT REPORT  ·  CONFIDENTIAL', margin, 10);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, 10, { align: 'right' });
      doc.setDrawColor(...PDF.color.rule);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    };

    const addPageFooter = () => {
      const footerY = pageHeight - 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...PDF.color.muted);
      doc.text(`Generated: ${new Date().toLocaleString()}  ·  ARCOLAB Digital Auditor`, margin, footerY);
      doc.setDrawColor(...PDF.color.rule);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    };

    const checkPageBreak = (needed: number) => {
      if (y + needed > pageHeight - 18) {
        addPageFooter();
        doc.addPage();
        y = 18;
        addPageHeader();
      }
    };

    const sectionTitle = (title: string) => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PDF.font.sectionTitle);
      doc.setTextColor(...PDF.color.dark);
      doc.text(title, margin, y);
      y += 3;
      doc.setDrawColor(...PDF.color.rule);
      doc.setLineWidth(0.25);
      doc.line(margin, y, pageWidth - margin, y);
      y += PDF.afterSectionTitle;
    };

    // ── Cover Header ───────────────────────────────────────────
    doc.setFillColor(...PDF.color.brand);
    doc.rect(margin, y, cw, 24, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF.font.cover);
    doc.setTextColor(...PDF.color.white);
    doc.text('ARCOLAB 5S WORKPLACE AUDIT REPORT', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF.font.bodySm);
    doc.setTextColor(...PDF.color.coverSubtitle);
    doc.text('DIGITAL AUDITOR COMPLIANCE RECORD  ·  CONFIDENTIAL', margin + 6, y + 17);
    y += 30;

    // ── Audit Metadata ────────────────────────────────────────
    sectionTitle('AUDIT INFORMATION');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF.font.body);
    doc.setTextColor(...PDF.color.mid);

    const lx = margin + PDF.colIndent;
    const rx = margin + cw / 2 + PDF.colRightOffset;
    const rowH = PDF.metaRowHeight;

    const metaRows: [string, string][] = [
      [`Company: ${areaInfo.companyName}`, `Date Conducted: ${areaInfo.auditDate}`],
      [`Auditor: ${areaInfo.auditor}`, `Area / Station: ${areaInfo.areaName}`],
      [`Department: ${areaInfo.department}`, `Industry: ${areaInfo.industry}`],
      [`Workspace Type: ${areaInfo.workspaceType}`, `Scoring Standard: Physical Audit 5S (0–4)`],
    ];
    metaRows.forEach(([left, right]) => {
      doc.text(left, lx, y);
      doc.text(right, rx, y);
      y += rowH;
    });
    y += 6;

    // ── Executive Summary Box ─────────────────────────────────
    checkPageBreak(36);
    doc.setFillColor(...PDF.color.cardBg);
    doc.setDrawColor(...PDF.color.cardBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, cw, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF.font.body);
    doc.setTextColor(80, 100, 120);
    doc.text('EXECUTIVE COMPLIANCE SUMMARY', margin + 5, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF.font.headline);
    doc.setTextColor(...PDF.color.brand);
    doc.text(`Overall Score: ${overallScore} / ${overallMaxScore}  (${overallPercentage}%)`, margin + 5, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF.font.body);
    doc.setTextColor(...PDF.color.mid);
    doc.text(`Rating: ${overallRating.toUpperCase()}   |   Critical Findings: ${enhancedSummary.criticalFindings}`, margin + 5, y + 22);
    doc.text(`Audit Confidence: ${enhancedSummary.auditConfidence !== null ? enhancedSummary.auditConfidence + '%' : 'N/A'}`, margin + 5, y + 28);

    doc.text(`Highest Pillar: ${enhancedSummary.highestPillar}`, rx, y + 15);
    doc.text(`Lowest Pillar: ${enhancedSummary.lowestPillar}`, rx, y + 22);
    doc.text(`Image Quality: ${enhancedSummary.imageQualityScore !== null ? `${enhancedSummary.imageQualityScore}/100 (${enhancedSummary.imageQualityLevel})` : 'N/A'}`, rx, y + 28);
    y += 40;

    // ── Pillar Score Table ────────────────────────────────────
    checkPageBreak(48);
    sectionTitle('5S PILLAR SCORE BREAKDOWN');

    // Table header
    doc.setFillColor(...PDF.color.tableHead);
    doc.rect(margin, y - 1, cw, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF.font.bodySm);
    doc.setTextColor(...PDF.color.mid);
    doc.text('Pillar', margin + 4, y + 4);
    doc.text('Score', margin + 70, y + 4);
    doc.text('Compliance %', margin + 100, y + 4);
    doc.text('Rating', margin + 142, y + 4);
    y += 9;

    doc.setLineWidth(0.1);
    doc.setDrawColor(...PDF.color.rule);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF.font.body);
    pillars.forEach((p, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(...PDF.color.rowTint);
        doc.rect(margin, y - 3, cw, 6.5, 'F');
      }
      doc.setTextColor(...PDF.color.dark);
      doc.text(p.label, margin + 4, y + 2);
      doc.text(`${p.score} / ${p.maxScore}`, margin + 70, y + 2);
      doc.text(`${p.percentage}%`, margin + 100, y + 2);
      doc.text(p.rating, margin + 142, y + 2);
      y += 6.5;
    });
    y += PDF.blockGap;

    // ── Strengths & Weaknesses ────────────────────────────────
    checkPageBreak(50);
    sectionTitle('STRENGTHS & AREAS OF CONCERN');

    const strLeft = margin + 3;
    const strMaxWidth = (pageWidth - margin) - strLeft - 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF.font.body);
    doc.setTextColor(...PDF.color.success);
    doc.text('Overall Strengths:', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF.font.body);
    doc.setTextColor(...PDF.color.mid);
    enhancedSummary.strengths.forEach((str) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF.font.body);
      const lines = doc.splitTextToSize(`• ${str}`, strMaxWidth);
      checkPageBreak(lines.length * PDF.lineHeight + 2);
      doc.text(lines, strLeft, y);
      y += lines.length * PDF.lineHeight;
    });

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF.font.body);
    doc.setTextColor(...PDF.color.warning);
    doc.text('Areas of Concern:', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF.font.body);
    doc.setTextColor(...PDF.color.mid);
    enhancedSummary.weaknesses.forEach((weak) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF.font.body);
      const lines = doc.splitTextToSize(`• ${weak}`, strMaxWidth);
      checkPageBreak(lines.length * PDF.lineHeight + 2);
      doc.text(lines, strLeft, y);
      y += lines.length * PDF.lineHeight;
    });
    y += PDF.sectionGap;

    // ── Recommendations ───────────────────────────────────────
    if (recommendations && recommendations.length > 0) {
      checkPageBreak(40);
      sectionTitle('CORRECTIVE ACTION RECOMMENDATIONS');

      recommendations.forEach((rec, idx) => {
        const hLeft = margin + 2;
        const hMaxWidth = (pageWidth - margin) - hLeft - 2;

        const bodyLeft = margin + PDF.bodyIndent;
        const bodyMaxWidth = (pageWidth - margin) - bodyLeft - 2;

        // 1. Measure Rec Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF.font.body);
        const header = `${String(idx + 1).padStart(2, '0')}. [${rec.priority.toUpperCase()} ACTION]  ${rec.problem}`;
        const headerLines = doc.splitTextToSize(header, hMaxWidth);

        // 2. Measure Action Text
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(PDF.font.bodySm);
        const recLines = doc.splitTextToSize(`Action: ${rec.recommendation}`, bodyMaxWidth);

        // 3. Measure Benefit Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF.font.micro);
        const benefit = doc.splitTextToSize(`Benefit: ${rec.expectedBenefit}  |  Est. Score Gain: +${rec.scoreGain} pt(s)`, bodyMaxWidth);

        const totalH = headerLines.length * PDF.lineHeight + PDF.lineHeight + recLines.length * PDF.lineHeightSm + benefit.length * PDF.lineHeightSm + 8;
        checkPageBreak(totalH);

        // Render Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF.font.body);
        doc.setTextColor(...PDF.color.dark);
        doc.text(headerLines, hLeft, y);
        y += headerLines.length * PDF.lineHeight + 1;

        // Render Pillar Tag
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF.font.micro);
        doc.setTextColor(...PDF.color.muted);
        doc.text(`Pillar: ${rec.pillarName.toUpperCase()}`, bodyLeft, y);
        y += PDF.lineHeight;

        // Render Action Text
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(PDF.font.bodySm);
        doc.setTextColor(30, 80, 55);
        doc.text(recLines, bodyLeft, y);
        y += recLines.length * PDF.lineHeightSm;

        // Render Benefit Text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF.font.micro);
        doc.setTextColor(...PDF.color.mid);
        doc.text(benefit, bodyLeft, y);
        y += benefit.length * PDF.lineHeightSm + 5;
      });
    }

    // ── Detailed Question Assessment ──────────────────────────
    checkPageBreak(20);
    sectionTitle('DETAILED QUESTION ASSESSMENT');

    pillars.forEach((p) => {
      checkPageBreak(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PDF.font.subTitle);
      doc.setTextColor(...PDF.color.brand);
      doc.text(`${p.label.toUpperCase()}  (${p.score} / ${p.maxScore} pts  ·  ${p.percentage}%)`, margin, y);
      y += 6;

      p.questions.forEach((q, idx) => {
        const ratingLabel =
          q.score === 4 ? 'VERY GOOD' :
          q.score === 3 ? 'GOOD' :
          q.score === 2 ? 'AVERAGE' :
          q.score === 1 ? 'BAD' : 'VERY BAD';
        const reasonText = q.reason ? `Reason: ${q.reason}` : 'Reason: Not recorded.';

        // CRITICAL FIX: Explicitly set font & size BEFORE measuring Question text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF.font.body);
        const qLeft = margin + 3;
        const qMaxWidth = (pageWidth - margin) - qLeft - 2;
        const qLines = doc.splitTextToSize(`${idx + 1}. ${q.question}`, qMaxWidth);

        // CRITICAL FIX: Explicitly set font & size BEFORE measuring Reason text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF.font.micro);
        const reasonLeft = margin + 5;
        const reasonMaxWidth = (pageWidth - margin) - reasonLeft - 2;
        const reasonLines = doc.splitTextToSize(reasonText, reasonMaxWidth);

        const blockH = qLines.length * PDF.lineHeight + reasonLines.length * PDF.lineHeightSm + 12;
        checkPageBreak(blockH);

        // Render Question
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF.font.body);
        doc.setTextColor(...PDF.color.dark);
        doc.text(qLines, qLeft, y);
        y += qLines.length * PDF.lineHeight;

        // Render Score & rating
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(PDF.font.micro);
        doc.setTextColor(...PDF.color.brand);
        doc.text(`Score: ${q.score} / 4  ·  ${ratingLabel}`, margin + 5, y);
        y += PDF.lineHeight;

        // Render Reason
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(PDF.font.micro);
        doc.setTextColor(...PDF.color.mid);
        doc.text(reasonLines, reasonLeft, y);
        y += reasonLines.length * PDF.lineHeightSm + 4;
      });
      y += 3;
    });

    // ── Timeline Footer ───────────────────────────────────────
    if (timeline) {
      checkPageBreak(30);
      sectionTitle('AUDIT LOG TIMELINE');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF.font.bodySm);
      doc.setTextColor(...PDF.color.muted);

      const formatTS = (iso: string | null) => iso ? new Date(iso).toLocaleString() : 'N/A';

      [
        `Image Uploaded:        ${formatTS(timeline.imageUploaded)}`,
        `Validation Completed:  ${formatTS(timeline.validationComplete)}`,
        `Audit Started:         ${formatTS(timeline.auditStarted)}`,
        `Audit Completed:       ${formatTS(timeline.auditCompleted)}`,
      ].forEach((line) => {
        doc.text(line, margin + 2, y); y += 5;
      });
    }

    // ── AI Workplace Transformation Preview (PDF) ──────────────
    const previewResult = getCachedTransformationPreview(areaInfo.areaName || 'current_audit');
    if (previewResult && previewResult.status === 'complete') {
      checkPageBreak(75);
      sectionTitle('AI WORKPLACE TRANSFORMATION PREVIEW');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(PDF.font.bodySm);
      doc.setTextColor(...PDF.color.mid);
      const capLines = doc.splitTextToSize(
        'AI-generated conceptual visualization illustrating expected workplace conditions after implementing the recommended corrective actions and 5S principles.',
        cw - 4
      );
      doc.text(capLines, margin + 2, y);
      y += capLines.length * PDF.lineHeightSm + 3;

      // Badges line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PDF.font.micro);
      doc.setTextColor(...PDF.color.brand);
      doc.text(`BEFORE · CURRENT ${overallPercentage}%   ➔   AFTER · ILLUSTRATIVE TARGET ${previewResult.illustrativeTargetPercentage}% (${previewResult.targetRating.replace('_', ' ')})`, margin + 2, y);
      y += 6;

      // Side-by-side or stacked images box
      const boxW = (cw - 4) / 2;
      const boxH = 45;

      try {
        const cleanBefore = workplaceImage.replace(/^__geo:[^_]*__/, '');
        doc.addImage(cleanBefore, 'JPEG', margin, y, boxW, boxH);
        doc.addImage(previewResult.transformedImageUrl, 'JPEG', margin + boxW + 4, y, boxW, boxH);
        y += boxH + 4;
      } catch {
        y += 6;
      }

      // Mandatory Industrial Disclaimer Box
      doc.setFillColor(...PDF.color.cardBg);
      doc.setDrawColor(...PDF.color.cardBorder);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, cw, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...PDF.color.muted);
      const discText =
        'Disclaimer: This visualization is AI-generated for planning and communication purposes. It represents an expected workplace condition after implementing recommended 5S principles. It is an illustrative conceptual forecast and does not constitute an actual post-implementation photograph or a second formal audit result.';
      const discLines = doc.splitTextToSize(discText, cw - 6);
      doc.text(discLines, margin + 3, y + 4);
      y += 18;
    }

    addPageFooter();
    doc.save(`5S-Audit-${areaInfo.areaName.replace(/\s+/g, '-')}-${areaInfo.auditDate.replace(/\s+/g, '-')}.pdf`);
  };


  return (
    <AuditPage>
      {/* Progress Stepper */}
      <AuditProgressStepper currentStep={6} />

      {/* ── Report Header ─────────────────────────────────────────────── */}
      <ReportHeader
        title="ARCOLAB 5S Workplace Audit"
        subtitle="Digital Auditor Compliance Report"
        actions={
          <>
            <button onClick={handleDownloadPDF} className={ds.interactive.ghostButton}>
              <Download className="h-3.5 w-3.5" />
              Download Report
            </button>
            <button
              onClick={() => setDevMode(!devMode)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                devMode
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Dev Mode
            </button>
          </>
        }
        meta={
          <div className="space-y-4">
            <MetaGrid rows={[
              ['Company', areaInfo.companyName],
              ['Date Conducted', areaInfo.auditDate],
              ['Area / Workstation', areaInfo.areaName],
              ['Auditor', areaInfo.auditor],
            ]} />
            <div className={ds.divider + ' pt-4'}>
              <MetaGrid rows={[
                ['Department', areaInfo.department],
                ['Industry', areaInfo.industry],
                ['Workspace Type', areaInfo.workspaceType],
                ['Scoring Standard', 'Physical Audit 5S (0-4)'],
              ]} />
            </div>
          </div>
        }
      />

      {/* ── Executive Summary ─────────────────────────────────────────── */}
      <Section>
        <AuditSummaryCard summary={enhancedSummary} />
      </Section>

      {/* ── Pillar Navigation ─────────────────────────────────────────── */}
      <div className={`${ds.pillarGrid} no-print`}>
        {pillars.map((pillar) => (
          <PillarCard
            key={pillar.name}
            pillarKey={pillar.name as AuditPillar}
            label={pillar.label}
            jpName={pillar.jpName}
            score={pillar.score}
            maxScore={pillar.maxScore}
            percentage={pillar.percentage}
            rating={pillar.rating}
          />
        ))}
      </div>

      {/* ── Checklist Split Layout ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sticky image sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4 no-print">
          <Card>
            <CardHeader
              badge={
                <span className={`${ds.badge.base} ${ds.badge.primary} text-[9px]`}>
                  Audited State
                </span>
              }
            >
              Workplace Audit Evidence
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="relative group overflow-hidden rounded-lg border border-border bg-muted">
                <img
                  src={workplaceImage.replace(/^__geo:[^_]*__/, "")}
                  alt="Audited Workspace"
                  className="w-full h-auto max-h-96 object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <p className={`${ds.type.meta} italic text-center leading-relaxed`}>
                Verify questions below against this active visual record.
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Detailed pillar checklist */}
        <div className="lg:col-span-2 space-y-5">
          <SectionHeader
            title="Detailed Pillar Checklist"
            subtitle="Click any row below to review observations"
            className="no-print"
          />
          {pillars.map((pillar) => (
            <PillarAssessment
              key={pillar.name}
              pillarKey={pillar.name as AuditPillar}
              label={pillar.label}
              jpName={pillar.jpName}
              score={pillar.score}
              maxScore={pillar.maxScore}
              percentage={pillar.percentage}
              rating={pillar.rating}
              questions={pillar.questions}
            />
          ))}
        </div>
      </div>

      {/* Print-only workplace image block */}
      <div className="hidden print:block space-y-3 my-8">
        <h4 className={`${ds.type.cardTitle} border-b border-border pb-1`}>
          Workplace Image Audit Evidence
        </h4>
        <img
          src={workplaceImage.replace(/^__geo:[^_]*__/, "")}
          alt="Audited Workspace Evidence"
          className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-border"
        />
      </div>

      {/* ── Overall Score ─────────────────────────────────────────────── */}
      <Section>
        <AuditScoreCard
          score={overallScore}
          maxScore={overallMaxScore}
          percentage={overallPercentage}
          rating={overallRating}
        />
      </Section>

      {/* ── Radar Chart + Score Breakdown ────────────────────────────── */}
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>Score Breakdown</CardHeader>
              <CardBody className="space-y-3">
                {pillars.map((p) => (
                  <div key={p.name} className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">{p.label}</span>
                    <span className="font-mono font-bold text-foreground">{p.score} / 16</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
          <div className="md:col-span-2">
            <RadarScoreChart pillars={pillars} />
          </div>
        </div>
      </Section>

      {/* ── Improvement Recommendations ───────────────────────────────── */}
      <Section>
        <SectionHeader
          title="Improvement Recommendations"
          icon={<Sparkles className="h-4 w-4 text-amber-500" />}
        />
        <RecommendationCard recommendations={recommendations} />
      </Section>

      {/* ── AI Workplace Transformation Preview ───────────────────────── */}
      <Section>
        <TransformationPreviewSection
          auditId={areaInfo.areaName || 'current_audit'}
          beforeImage={workplaceImage.replace(/^__geo:[^_]*__/, '')}
          currentScore={overallScore}
          maxScore={overallMaxScore}
          currentPercentage={overallPercentage}
          rating={overallRating}
          context={{
            areaName: areaInfo.areaName,
            workspaceType: areaInfo.workspaceType,
            industry: areaInfo.industry,
            department: areaInfo.department,
          }}
          recommendations={recommendations.map((r) => ({
            pillarName: r.pillarName,
            problem: r.problem,
            recommendation: r.recommendation,
            priority: r.priority as 'high' | 'medium' | 'low',
            expectedBenefit: r.expectedBenefit,
            scoreGain: r.scoreGain,
          }))}
        />
      </Section>

      {/* ── Audit Timeline ────────────────────────────────────────────── */}
      {timeline && (
        <Section>
          <AuditTimelineComponent timeline={timeline} />
        </Section>
      )}

      {/* ── Download Button ───────────────────────────────────────────── */}
      <div className="no-print">
        <button onClick={handleDownloadPDF} className={ds.interactive.primaryButton}>
          <Download className="h-5 w-5" />
          Download PDF Report
        </button>
      </div>

      {/* ── Developer Mode ────────────────────────────────────────────── */}
      {devMode && (
        <Card className="border-destructive/20 no-print">
          <CardHeader
            badge={
              <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded font-bold">
                DEV ONLY
              </span>
            }
          >
            <span className="text-destructive flex items-center gap-1.5 font-mono">
              <Terminal className="h-4 w-4" />
              AI Developer Telemetry
            </span>
          </CardHeader>
          <CardBody className="font-mono text-xs space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={ds.type.label}>Vision Model</p>
                <p className="text-foreground mt-0.5">{data.vision_model}</p>
              </div>
              <div>
                <p className={ds.type.label}>Prompt Version</p>
                <p className="text-foreground mt-0.5">v{data.prompt_version}</p>
              </div>
            </div>
            <div>
              <p className={ds.type.label}>Raw JSON Payload</p>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto max-h-60 text-[10px] border border-border mt-1">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>
      )}
    </AuditPage>
  );
}