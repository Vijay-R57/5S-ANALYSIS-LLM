/**
 * src/design-system/components.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCOLAB Global Design System — Reusable Layout Components
 *
 * Every page in the application should compose its layout from these
 * primitives. This guarantees a consistent grid, spacing, and card standard
 * across the entire application without per-page manual adjustment.
 *
 * Usage: import { AuditPage, Section, Card, SectionHeader } from '@/design-system/components';
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Star } from 'lucide-react';
import { ds } from './tokens';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BaseProps {
  children: React.ReactNode;
  className?: string;
}

// ── Page ─────────────────────────────────────────────────────────────────────

/**
 * Root page wrapper for every audit page.
 * Establishes the global space-y rhythm and font-sans baseline.
 */
export function AuditPage({ children, className = '' }: BaseProps) {
  return (
    <div className={`${ds.layout.page} ${className}`}>
      {children}
    </div>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────

/**
 * Wraps a major page section with consistent vertical spacing.
 * Use for every top-level block (summary, checklist, recommendations, etc.)
 */
export function Section({ children, className = '' }: BaseProps) {
  return (
    <div className={`${ds.layout.innerGap} ${ds.print.breakAvoid} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Section title + optional subtitle row.
 * Place above each major group of content.
 */
export function SectionHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="space-y-0.5">
        <h3 className={ds.type.sectionTitle + ' flex items-center gap-2'}>
          {icon}
          {title}
        </h3>
        {subtitle && <p className={ds.type.sectionSubtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

/**
 * Standard ARCOLAB card shell.
 * All cards must use this component to guarantee identical radius, border, shadow.
 */
export function Card({ children, className = '' }: BaseProps) {
  return (
    <div className={`${ds.card.base} overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card header bar — appears at the top of a card with a bottom border.
 */
export function CardHeader({
  children,
  badge,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className={`${ds.card.header} flex items-center justify-between`}>
      <h4 className={ds.card.headerTitle}>{children}</h4>
      {badge && <div>{badge}</div>}
    </div>
  );
}

/**
 * Card body — applies consistent padding and vertical gap.
 */
export function CardBody({ children, className = '' }: BaseProps) {
  return (
    <div className={`${ds.card.body} ${className}`}>
      {children}
    </div>
  );
}

// ── Detail Sub-cards ─────────────────────────────────────────────────────────

/**
 * Small info card used inside collapsible question detail rows.
 * (Reason, Confidence, etc.)
 */
export function DetailCard({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/20 border border-border/40 rounded-lg p-3.5 space-y-2">
      <div className="flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider font-bold text-[9px]">
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-xs leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// ── Metric Grid ───────────────────────────────────────────────────────────────

/**
 * Grid of small metric stat cells inside a card.
 */
export function MetricGrid({
  children,
  cols = 4,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}) {
  const colClass = cols === 2
    ? 'grid-cols-2'
    : cols === 3
    ? 'grid-cols-2 sm:grid-cols-3'
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-4`}>
      {children}
    </div>
  );
}

/**
 * Individual metric stat cell.
 */
export function MetricCell({
  label,
  value,
  valueClass = '',
  sub,
  span,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  sub?: React.ReactNode;
  span?: string;
}) {
  return (
    <div className={`${ds.card.metricCell} ${span ?? ''}`}>
      <p className={ds.card.metricLabel}>{label}</p>
      <p className={`${ds.card.metricValue} ${valueClass}`}>{value}</p>
      {sub && <p className={ds.type.meta + ' mt-1'}>{sub}</p>}
    </div>
  );
}

// ── Two-Column Detail Layout ──────────────────────────────────────────────────

/**
 * Split layout: sticky sidebar (image / chart) + scrollable main content.
 * Used on the results page.
 */
export function SplitLayout({
  sidebar,
  main,
  hasSidebar = true,
}: {
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  hasSidebar?: boolean;
}) {
  if (!hasSidebar || !sidebar) {
    return <div className="space-y-5">{main}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4 no-print">
        {sidebar}
      </div>
      <div className="lg:col-span-2 space-y-5">
        {main}
      </div>
    </div>
  );
}

// ── Report Header (Web) ───────────────────────────────────────────────────────

/**
 * Branded report header card (AL logo + title + action buttons).
 */
export function ReportHeader({
  title,
  subtitle,
  actions,
  meta,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <Card className="print:border-none print:shadow-none">
      <div className={ds.card.padding}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shrink-0">
              AL
            </div>
            <div>
              <h1 className={ds.type.pageTitle}>{title}</h1>
              <p className={ds.type.meta + ' uppercase tracking-widest font-semibold mt-0.5'}>{subtitle}</p>
            </div>
          </div>
          {actions && (
            <div className={`flex items-center gap-2 ${ds.print.hidden}`}>{actions}</div>
          )}
        </div>
        {meta && <div className="pt-4">{meta}</div>}
      </div>
    </Card>
  );
}

// ── Metadata Grid ─────────────────────────────────────────────────────────────

/**
 * Responsive 4-column metadata grid (Company / Date / Area / Auditor etc.)
 */
export function MetaGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
      {rows.map(([label, value], i) => (
        <div key={i}>
          <p className={ds.type.label}>{label}</p>
          <p className="font-semibold text-foreground mt-0.5 truncate">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Standardized 5-Star Rating Component ─────────────────────────────────────

/**
 * Deterministically maps audit rating status or numeric score to 1-5 star count.
 */
export function getStarCountFromRating(rating: string | number): number {
  if (typeof rating === 'number') {
    return Math.min(5, Math.max(1, Math.round(rating)));
  }
  const normalized = String(rating || '').trim().toUpperCase().replace(/\s+/g, '_');
  switch (normalized) {
    case 'VERY_GOOD':
    case 'EXCELLENT':
      return 5;
    case 'GOOD':
      return 4;
    case 'AVERAGE':
      return 3;
    case 'BAD':
    case 'NEEDS_IMPROVEMENT':
      return 2;
    case 'VERY_BAD':
    case 'POOR':
      return 1;
    default:
      return 3;
  }
}

/**
 * Standardized 5-Star Rating UI Component.
 * Always renders exactly 5 stars.
 * Active stars use Gold/Brand Accent with a subtle aura glow.
 * Inactive stars use a visible neutral gray with reduced opacity.
 */
export function StarRating({
  rating,
  size = 'md',
  className = '',
}: {
  rating: string | number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const activeCount = getStarCountFromRating(rating);
  const sizeClass =
    size === 'sm' ? ds.star.sizeSm : size === 'lg' ? ds.star.sizeLg : ds.star.size;

  return (
    <div
      className={`${ds.star.container} ${className}`}
      aria-label={`Audit Rating: ${activeCount} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, idx) => {
        const isActive = idx < activeCount;
        return (
          <Star
            key={idx}
            className={`${sizeClass} ${isActive ? ds.star.active : ds.star.inactive}`}
          />
        );
      })}
    </div>
  );
}
