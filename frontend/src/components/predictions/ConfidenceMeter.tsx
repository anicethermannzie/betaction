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
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Confidence</span>
        <span className={cn('font-semibold', cfg.color)}>{cfg.label}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', cfg.bg)}
          style={{ width: cfg.width }}
        />
      </div>
    </div>
  );
}
