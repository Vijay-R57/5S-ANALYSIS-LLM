/**
 * src/design-system/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ARCOLAB Global Design System — Barrel Export
 *
 * Import everything from this single entry point:
 *   import { ds, PDF, contentWidth } from '@/design-system';
 *   import { Card, Section, AuditPage } from '@/design-system';
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { ds } from './tokens';
export { PDF, contentWidth, BRAND_GREEN } from './pdfTokens';
export {
  AuditPage,
  Section,
  SectionHeader,
  Card,
  CardHeader,
  CardBody,
  DetailCard,
  MetricGrid,
  MetricCell,
  SplitLayout,
  ReportHeader,
  MetaGrid,
  StarRating,
  getStarCountFromRating,
} from './components';
