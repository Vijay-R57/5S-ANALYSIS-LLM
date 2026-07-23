/**
 * src/design-system/tokens.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCOLAB Global Design System — Token Definitions
 *
 * Single source of truth for spacing, typography class names, and layout
 * constants used across every page and component in the web application.
 *
 * Usage: import { ds } from '@/design-system/tokens';
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ds = {
  // ── Layout ──────────────────────────────────────────────────────────────────
  layout: {
    /** Root page wrapper — outer container of every audit page */
    page: 'space-y-6 font-sans',
    /** Maximum content width, centred on page */
    maxWidth: 'max-w-4xl mx-auto',
    /** Top-level section gap (between major blocks) */
    sectionGap: 'space-y-6',
    /** Inner section gap (between related sub-blocks) */
    innerGap: 'space-y-4',
    /** Standard section padding for content regions */
    sectionPadding: 'py-8',
  },

  // ── Cards ────────────────────────────────────────────────────────────────────
  card: {
    /** Base card shell */
    base: 'bg-card border border-border rounded-xl shadow-sm',
    /** Card padding */
    padding: 'p-5',
    /** Card header (label bar at top of card) */
    header: 'px-5 py-4 border-b border-border bg-muted/20',
    /** Card header title typography */
    headerTitle: 'text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2',
    /** Card inner content area (below header) */
    body: 'p-5 space-y-5',
    /** Inner metric cell (small stat block inside a card) */
    metricCell: 'bg-muted/10 border border-border/50 rounded-lg p-3 text-center',
    /** Metric cell label */
    metricLabel: 'text-[10px] text-muted-foreground uppercase font-bold tracking-wider',
    /** Metric cell value */
    metricValue: 'text-xl font-extrabold text-foreground mt-1',
  },

  // ── Typography ───────────────────────────────────────────────────────────────
  type: {
    /** Page-level H1 */
    pageTitle: 'text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground uppercase',
    /** Primary section heading */
    sectionTitle: 'text-sm font-black uppercase tracking-wider text-foreground',
    /** Section subtitle (supporting) */
    sectionSubtitle: 'text-xs text-muted-foreground font-semibold',
    /** Card heading */
    cardTitle: 'text-xs font-black uppercase tracking-wider text-foreground',
    /** Question text */
    questionText: 'text-sm font-semibold text-foreground leading-snug',
    /** Question ID / mono metadata */
    questionMeta: 'text-[10px] text-muted-foreground font-mono',
    /** Standard label (uppercase micro-label) */
    label: 'text-[10px] text-muted-foreground uppercase font-bold tracking-wider',
    /** Body text */
    body: 'text-xs text-foreground leading-relaxed',
    /** Secondary / muted body */
    bodyMuted: 'text-xs text-muted-foreground leading-relaxed',
    /** Confidence / metadata small print */
    meta: 'text-[10px] text-muted-foreground',
  },

  // ── Badges ───────────────────────────────────────────────────────────────────
  badge: {
    base: 'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    neutral: 'bg-muted text-muted-foreground border-border',
    primary: 'bg-primary/10 text-primary border-primary/20',
  },

  // ── Dividers ─────────────────────────────────────────────────────────────────
  divider: 'border-t border-border/40',

  // ── Pillar grid ──────────────────────────────────────────────────────────────
  pillarGrid: 'grid grid-cols-2 sm:grid-cols-5 gap-3 auto-rows-fr',

  // ── Print ────────────────────────────────────────────────────────────────────
  print: {
    hidden: 'no-print',
    breakAvoid: 'print:break-inside-avoid',
    breakBefore: 'print:break-before-page',
  },

  // ── Interactive states ───────────────────────────────────────────────────────
  interactive: {
    ghostButton:
      'inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer',
    primaryButton:
      'w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/10 cursor-pointer',
    expandButton:
      'p-1.5 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0',
    jumpLink:
      'inline-flex items-center gap-1 text-xs text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer',
  },

  // ── Star Rating ──────────────────────────────────────────────────────────────
  star: {
    /** Container element wrapper */
    container: 'flex items-center gap-1.5 shrink-0',
    /** Active star styling — gold fill with subtle aura glow */
    active: 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] transition-all duration-200',
    /** Inactive star styling — visible neutral gray with muted fill */
    inactive: 'fill-slate-200 text-slate-300 dark:fill-slate-800 dark:text-slate-700 opacity-60 transition-all duration-200',
    /** Standard star size (24px / 6 x 6) */
    size: 'h-6 w-6',
    /** Small star size (16px / 4 x 4) */
    sizeSm: 'h-4 w-4',
    /** Large star size (28px / 7 x 7) */
    sizeLg: 'h-7 w-7',
  },
} as const;
