import { ArrowUpRight, AlertTriangle, Clock, ArrowUp, Zap } from 'lucide-react';
import type { FutureAuditRecommendation } from '../types';

interface Props {
  recommendations: FutureAuditRecommendation[];
}

export default function RecommendationCard({ recommendations }: Props) {
  const getPriorityBadgeStyle = (prio: FutureAuditRecommendation['priority']) => {
    switch (prio) {
      case 'Immediate':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30';
      case 'High':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
      case 'Low':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getPriorityIcon = (prio: FutureAuditRecommendation['priority']) => {
    switch (prio) {
      case 'Immediate':
        return <Zap className="h-3.5 w-3.5 shrink-0" />;
      case 'High':
        return <AlertTriangle className="h-3.5 w-3.5 shrink-0" />;
      case 'Medium':
        return <Clock className="h-3.5 w-3.5 shrink-0" />;
      case 'Low':
        return <ArrowUp className="h-3.5 w-3.5 shrink-0" />;
    }
  };

  const handleJumpToQuestion = (qId: string) => {
    const element = document.getElementById(`question-${qId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/10', 'ring-2', 'ring-primary/40', 'rounded-lg');
      setTimeout(() => {
        element.classList.remove('bg-primary/10', 'ring-2', 'ring-primary/40');
      }, 3000);
      const expandButton = element.querySelector('button[aria-label*="Expand"]') as HTMLButtonElement;
      if (expandButton) expandButton.click();
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground shadow-sm">
        <p className="text-sm font-semibold">No recommendations found.</p>
        <p className="text-xs mt-1">Area is performing at 100% standard compliance!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:break-inside-avoid">
      {recommendations.map((rec, idx) => (
        <div
          key={rec.id}
          className="bg-card border border-border hover:border-primary/30 rounded-xl p-5 shadow-sm transition-all duration-300 flex flex-col gap-4 print:break-inside-avoid print:shadow-none"
        >
          {/* Rec number + priority + pillar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground">
                #{String(idx + 1).padStart(2, '0')}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityBadgeStyle(rec.priority)}`}>
                {getPriorityIcon(rec.priority)}
                {rec.priority.toUpperCase()} ACTION
              </span>
            </div>
            <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border font-mono">
              {rec.pillarName.toUpperCase()}
            </span>
          </div>

          {/* Problem */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Identified Problem
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">
              {rec.problem}
            </p>
          </div>

          {/* Recommended action */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-lg p-3.5 space-y-1.5">
            <p className="text-[10px] text-primary uppercase font-bold tracking-wider">
              Recommended Action
            </p>
            <p className="text-xs text-foreground font-medium leading-relaxed">
              {rec.recommendation}
            </p>
          </div>

          {/* Expected benefit + score gain */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Expected Benefit
              </p>
              <p className="text-muted-foreground leading-snug">
                {rec.expectedBenefit}
              </p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Est. Score Gain
              </p>
              <p className="text-emerald-500 font-extrabold text-sm">
                +{rec.scoreGain} Point{rec.scoreGain !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Jump link */}
          <div className="pt-1 border-t border-border/40 flex justify-end no-print">
            <button
              onClick={() => handleJumpToQuestion(rec.linkedQuestionId)}
              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer"
            >
              Jump to Question
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
