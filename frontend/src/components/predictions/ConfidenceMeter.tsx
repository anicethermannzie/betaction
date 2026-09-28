import { cn, getConfidenceConfig } from '@/lib/utils';
import type { Prediction } from '@/types';

interface ConfidenceMeterProps {
  confidence: Prediction['confidence'];
  className?: string;
}

export function ConfidenceMeter({ confidence, className }: ConfidenceMeterProps) {
  const cfg = getConfidenceConfig(confidence);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <span className="label">Confidence</span>
        <span className={cn('num text-[11px] font-semibold uppercase tracking-wider', cfg.color)}>
          {cfg.label}
        </span>
      </div>
      <div className="stat-bar">
        <div className={cn('h-full', cfg.bg)} style={{ width: cfg.width }} />
      </div>
    </div>
  );
}
