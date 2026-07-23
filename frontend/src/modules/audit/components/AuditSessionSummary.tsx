/**
 * src/modules/audit/components/AuditSessionSummary.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Past session audit report dashboard.
 * Uses the global ARCOLAB Design System for consistent layout and typography.
 */

import React, { useState } from 'react';
import { Printer, Terminal, Sparkles } from 'lucide-react';
import { mapSessionToAuditResult } from '../utils/auditMapper';
import type { AuditPillar } from '../constants/pillars';
import AuditProgressStepper from './AuditProgressStepper';
import AuditScoreCard from './AuditScoreCard';
import PillarCard from './PillarCard';
import PillarAssessment from './PillarAssessment';
import RecommendationCard from './RecommendationCard';
import RadarScoreChart from './RadarScoreChart';
import AuditSummaryCard from './AuditSummaryCard';
import TransformationPreviewSection from './TransformationPreviewSection';
import type { AuditSession, AuditSessionItem, AuditItemResponse, AuditScoreSummary } from '../types';
import {
  ds,
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
  session: AuditSession & { items?: AuditSessionItem[]; responses?: AuditItemResponse[] };
  summary: AuditScoreSummary;
}

export default function AuditSessionSummary({ session, summary: legacySummary }: Props) {
  const [devMode, setDevMode] = useState(false);

  const auditResult = mapSessionToAuditResult(session);
  const { overallScore, overallMaxScore, overallPercentage, overallRating, pillars, recommendations, summary, areaInfo } = auditResult;

  const primaryImage = session.generated_after_image_url || session.before_image_url || '';

  const triggerPrint = () => window.print();

  return (
    <AuditPage>
      <AuditProgressStepper currentStep={3} />

      {/* ── Report Header ─────────────────────────────────────────────── */}
      <ReportHeader
        title="ARCOLAB 5S Workplace Audit"
        subtitle="Digital Auditor Compliance Report"
        actions={
          <>
            <button onClick={triggerPrint} className={ds.interactive.ghostButton}>
              <Printer className="h-3.5 w-3.5" />
              Print / Export
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

      {/* ── Split layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {primaryImage && (
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
                <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={primaryImage}
                    alt="Audited Workspace"
                    className="w-full h-auto max-h-96 object-contain rounded-lg"
                  />
                </div>
                <p className={`${ds.type.meta} italic text-center leading-relaxed`}>
                  Verify questions below against this active visual record.
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        <div className={primaryImage ? 'lg:col-span-2 space-y-5' : 'lg:col-span-3 space-y-5'}>
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

      {/* Print-only image */}
      {primaryImage && (
        <div className="hidden print:block space-y-3 my-8">
          <h4 className={`${ds.type.cardTitle} border-b border-border pb-1`}>
            Workplace Image Audit Evidence
          </h4>
          <img
            src={primaryImage}
            alt="Audited Workspace Evidence"
            className="w-full h-auto max-h-[400px] object-contain rounded-lg border border-border"
          />
        </div>
      )}

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

      {/* ── Recommendations ───────────────────────────────────────────── */}
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
          auditId={session.id || 'past_session'}
          beforeImage={primaryImage}
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

      {/* ── Executive Summary ─────────────────────────────────────────── */}
      <Section>
        <AuditSummaryCard summary={summary} />
      </Section>

      {/* ── Print Button ─────────────────────────────────────────────── */}
      <div className="no-print">
        <button onClick={triggerPrint} className={ds.interactive.primaryButton}>
          <Printer className="h-5 w-5" />
          Print Audit Report
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
              Developer Audit Session Logs
            </span>
          </CardHeader>
          <CardBody className="font-mono text-xs space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={ds.type.label}>Vision Model Used</p>
                <p className="text-foreground mt-0.5">{session.vision_model_used || 'N/A'}</p>
              </div>
              <div>
                <p className={ds.type.label}>Prompt Version ID</p>
                <p className="text-foreground mt-0.5">{session.prompt_version_id || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className={ds.type.label}>Full Database Session Record</p>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto max-h-60 text-[10px] border border-border mt-1">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </CardBody>
        </Card>
      )}
    </AuditPage>
  );
}
