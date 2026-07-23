/**
 * src/constants/facilities.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for official ARCOLAB facility locations / facility context
 * across both 5S Audit and 5S Comparison modules.
 */

export const OFFICIAL_LOCATIONS = [
  "Arcolab Corporate HQ (Bengaluru)",
  "Arcolab R&D Center (Bengaluru)",
  "Strides Global Formulation Facility (KBS)",
  "Strides Biotech Manufacturing Unit (KBS)",
  "Arcolab Analytical Testing Lab (KBS)",
  "Strides Oral Solid Dosage Facility (USFDA Approved)",
  "Arcolab Quality Control Center",
  "Strides Packing & Logistics Hub",
  "General Industrial Workplace",
] as const;

export type OfficialLocation = (typeof OFFICIAL_LOCATIONS)[number];
