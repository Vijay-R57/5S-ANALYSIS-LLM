/**
 * src/modules/audit/components/ImprovementPreviewCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 – Before / After Workplace Improvement Preview Card
 *
 * Consumes ONLY ImprovementVisualizationResult from the IVE service.
 * Never imports from adapters, repositories, or the IVE service internals.
 *
 * Zero-Regression Guarantee: NEW component – no existing component is modified here.
 */

import { useState } from 'react';
import { Sparkles, ZoomIn, X, Info, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { ImprovementVisualizationResult } from '@/services/visualization/types';

interface Props {
  result: ImprovementVisualizationResult;
}

export default function ImprovementPreviewCard({ result }: Props) {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('after');
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [showMeta, setShowMeta] = useState(false);

  const { originalImageUrl, asset, physicalActions, metadata, disclaimerText } = result;
  const isFallback = metadata.executionStatus === 'SKIPPED' || metadata.executionStatus === 'ERROR';
  const isValidationFail = metadata.executionStatus === 'VALIDATION_FAILED';

  // ── Skipped / Error state ──────────────────────────────────────────────────
  if (isFallback) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
            Illustrative Improvement Preview
          </h3>
        </div>
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          {metadata.failureReason ??
            'No improvement visualization was generated because no meaningful corrective actions were identified. ' +
            'This workplace may already be highly compliant with 5S standards.'}
        </p>
      </div>
    );
  }

  const currentImageSrc = activeTab === 'before' ? originalImageUrl : asset.primaryUrl;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-amber-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              Illustrative Improvement Preview
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Expected workplace appearance after implementing approved 5S recommendations
            </p>
          </div>
        </div>

        {/* Version badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
            IVE {metadata.visualizationPromptVersion}
          </span>
          {isValidationFail && (
            <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Validation Warning
            </span>
          )}
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('before')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'before'
              ? 'bg-muted text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          Current Workplace
        </button>
        <button
          onClick={() => setActiveTab('after')}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'after'
              ? 'bg-muted text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          Expected After 5S
        </button>
      </div>

      {/* Image Viewer */}
      <div className="relative group">
        <div className="relative overflow-hidden bg-muted flex items-center justify-center min-h-[300px] max-h-[500px]">
          <img
            src={currentImageSrc.replace(/^__geo:[^_]*__/, '')}
            alt={activeTab === 'before' ? 'Current workplace state' : 'Expected workplace after 5S improvements'}
            className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300"
          />
          {/* Zoom button overlay */}
          <button
            onClick={() => setZoomSrc(currentImageSrc)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-2 text-white hover:bg-black/70"
            aria-label="Expand image"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Caption */}
        <div className="px-5 py-2 bg-muted/30 text-center">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            {activeTab === 'before'
              ? '▲  Current Audited Workplace State'
              : '▼  Expected Post-5S Improvement State'}
          </p>
        </div>
      </div>

      {/* Physical Actions Applied */}
      {physicalActions.length > 0 && (
        <div className="px-5 py-4 border-t border-border/40">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
            5S Improvements Applied ({physicalActions.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {physicalActions.slice(0, 8).map((action, i) => (
              <span
                key={i}
                className="text-[10px] bg-primary/8 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium"
                title={action.description}
              >
                {action.domain.replace(/_/g, ' ')}
              </span>
            ))}
            {physicalActions.length > 8 && (
              <span className="text-[10px] text-muted-foreground px-2 py-0.5">
                +{physicalActions.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-5 pb-4 pt-2 border-t border-border/40">
        <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
          <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            {disclaimerText}
          </p>
        </div>
      </div>

      {/* Telemetry (collapsed by default) */}
      <div className="px-5 pb-4">
        <button
          onClick={() => setShowMeta(!showMeta)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Clock className="h-3 w-3" />
          Visualization Metadata
          {showMeta ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {showMeta && (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono">
            {[
              ['ID', metadata.visualizationId],
              ['Status', metadata.executionStatus],
              ['Provider', metadata.configuredProvider],
              ['Model', metadata.configuredProviderModel],
              ['Prompt v', metadata.visualizationPromptVersion],
              ['Scene Policy v', metadata.scenePolicyVersion],
              ['Duration', `${metadata.generationDurationMs}ms`],
              ['Retries', String(metadata.retryCount)],
              ['Cache Hit', metadata.cacheHit ? 'Yes' : 'No'],
              ['Repo Hit', metadata.repositoryHit ? 'Yes' : 'No'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-1">
                <span className="text-muted-foreground">{label}:</span>
                <span className="text-foreground truncate">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomSrc(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomSrc(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close zoom"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={zoomSrc.replace(/^__geo:[^_]*__/, '')}
              alt="Expanded view"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
