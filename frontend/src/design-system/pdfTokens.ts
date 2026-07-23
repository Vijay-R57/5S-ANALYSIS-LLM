/**
 * src/design-system/pdfTokens.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCOLAB Global Design System — PDF Layout Constants
 *
 * Centralised jsPDF layout values for every generated report.
 * Import these instead of hardcoding numbers in any PDF function.
 *
 * Usage: import { PDF } from '@/design-system/pdfTokens';
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** ARCOLAB brand green in RGB */
export const BRAND_GREEN: [number, number, number] = [22, 78, 54];

/** Page geometry */
export const PDF = {
  /** All four page margins (mm) */
  margin: 18,
  /** Top margin for continuation pages (below header rule) */
  topAfterHeader: 18,
  /** Space reserved at page bottom for footer */
  footerReserve: 16,

  // ── Vertical rhythm (mm) ───────────────────────────────────────────────────
  /** Gap after a cover-style header block */
  afterHeader: 10,
  /** Gap after a section title underline */
  afterSectionTitle: 5,
  /** Row height for metadata pairs */
  metaRowHeight: 5.5,
  /** Standard paragraph line height */
  lineHeight: 4.5,
  /** Tight line height for small body text */
  lineHeightSm: 4.0,
  /** Vertical padding added after a completed block */
  blockGap: 6,
  /** Extra gap between major sections */
  sectionGap: 8,

  // ── Typography sizes (pt) ──────────────────────────────────────────────────
  font: {
    /** Running header / footer */
    runningHead: 7.5,
    /** Section title */
    sectionTitle: 9.5,
    /** Sub-section / pillar label */
    subTitle: 9,
    /** Standard body */
    body: 8.5,
    /** Small body / metadata */
    bodySm: 8,
    /** Micro label */
    micro: 7.5,
    /** Executive summary headline */
    headline: 13,
    /** Cover title */
    cover: 15,
  },

  // ── Colours (RGB) ──────────────────────────────────────────────────────────
  color: {
    /** ARCOLAB brand green */
    brand: BRAND_GREEN as [number, number, number],
    /** Dark text */
    dark: [40, 40, 40] as [number, number, number],
    /** Medium grey text */
    mid: [80, 80, 80] as [number, number, number],
    /** Light / muted text */
    muted: [120, 120, 120] as [number, number, number],
    /** Header / footer rule grey */
    rule: [210, 210, 210] as [number, number, number],
    /** Table header background */
    tableHead: [240, 244, 248] as [number, number, number],
    /** Alternating row tint */
    rowTint: [251, 253, 255] as [number, number, number],
    /** Card background */
    cardBg: [245, 248, 250] as [number, number, number],
    /** Card border */
    cardBorder: [210, 218, 225] as [number, number, number],
    /** Success / strength green */
    success: [21, 100, 52] as [number, number, number],
    /** Warning / concern amber */
    warning: [170, 75, 10] as [number, number, number],
    /** White */
    white: [255, 255, 255] as [number, number, number],
    /** Cover subtitle tint */
    coverSubtitle: [200, 230, 215] as [number, number, number],
  },

  // ── Column offsets (relative to margin) ───────────────────────────────────
  /** Left column indent */
  colIndent: 2,
  /** Right column x = margin + contentWidth/2 + 4 */
  colRightOffset: 4,
  /** Body text indent from left margin */
  bodyIndent: 4,
} as const;

/**
 * Compute the printable content width for a given page.
 * pageWidth is doc.internal.pageSize.width.
 */
export function contentWidth(pageWidth: number): number {
  return pageWidth - PDF.margin * 2;
}
