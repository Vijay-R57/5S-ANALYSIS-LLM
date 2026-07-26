import React from 'react';
import { Star } from 'lucide-react';

export type OverallAuditStatusType =
  | 'VERY_GOOD'
  | 'GOOD'
  | 'AVERAGE'
  | 'BAD'
  | 'VERY_BAD'
  | 'Excellent'
  | 'Good'
  | 'Average'
  | 'Needs Improvement'
  | 'Poor'
  | string
  | number;

interface AuditStarRatingProps {
  status: OverallAuditStatusType;
  className?: string;
  starSizeClass?: string;
}

/**
 * Deterministically maps the Overall Audit Status to active star count (1-5).
 * - VERY_GOOD / EXCELLENT: 5 active stars, 0 inactive
 * - GOOD: 4 active stars, 1 inactive star
 * - AVERAGE: 3 active stars, 2 inactive stars
 * - BAD / NEEDS IMPROVEMENT: 2 active stars, 3 inactive stars
 * - VERY_BAD / POOR: 1 active star, 4 inactive stars
 */
export function getActiveStarCount(status: OverallAuditStatusType): number {
  if (typeof status === 'number') {
    return Math.min(5, Math.max(1, Math.round(status)));
  }

  if (!status) return 3;

  const normalized = String(status).trim().toUpperCase();

  switch (normalized) {
    case 'VERY_GOOD':
    case 'VERY GOOD':
    case 'EXCELLENT':
    case '5':
      return 5;
    case 'GOOD':
    case '4':
      return 4;
    case 'AVERAGE':
    case 'FAIR':
    case '3':
      return 3;
    case 'BAD':
    case 'NEEDS_IMPROVEMENT':
    case 'NEEDS IMPROVEMENT':
    case '2':
      return 2;
    case 'VERY_BAD':
    case 'VERY BAD':
    case 'POOR':
    case 'CRITICAL':
    case '1':
      return 1;
    default: {
      if (normalized.includes('VERY_GOOD') || normalized.includes('EXCELLENT')) return 5;
      if (normalized.includes('GOOD')) return 4;
      if (normalized.includes('AVERAGE') || normalized.includes('FAIR')) return 3;
      if (normalized.includes('NEEDS') || normalized.includes('BAD')) return 2;
      if (normalized.includes('POOR') || normalized.includes('VERY_BAD') || normalized.includes('CRITICAL')) return 1;
      return 3;
    }
  }
}

/**
 * Standardized 5-Star Overall Audit Rating UI Component.
 * Always renders exactly five stars with deterministic active/inactive visual states.
 */
export default function AuditStarRating({
  status,
  className = '',
  starSizeClass = 'h-6 w-6 sm:h-7 sm:w-7',
}: AuditStarRatingProps) {
  const activeCount = getActiveStarCount(status);
  const totalStars = 5;

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 ${className}`}
      role="img"
      aria-label={`Overall Audit Rating: ${activeCount} out of 5 stars`}
    >
      {Array.from({ length: totalStars }, (_, index) => {
        const isActive = index < activeCount;
        return (
          <Star
            key={index}
            className={`${starSizeClass} transition-all duration-300 ${
              isActive
                ? 'fill-amber-400 text-amber-400 dark:fill-amber-400 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] opacity-100'
                : 'fill-slate-300/70 text-slate-300 dark:fill-slate-700/70 dark:text-slate-600 opacity-60'
            }`}
          />
        );
      })}
    </div>
  );
}
