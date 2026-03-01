import { cn, getPredictionColors } from '@/lib/utils';
import type { Prediction } from '@/types';

interface PredictionBadgeProps {
  prediction: Prediction['prediction'];
  homeTeam?: string;
  awayTeam?: string;
  className?: string;
}

const LABELS: Record<Prediction['prediction'], string> = {
  HOME_WIN: 'Home Win',
  DRAW:     'Draw',
  AWAY_WIN: 'Away Win',
};

export function PredictionBadge({
  prediction,
  homeTeam,
  awayTeam,
  className,
}: PredictionBadgeProps) {
  const colors = getPredictionColors(prediction);

  const label =
    prediction === 'HOME_WIN' && homeTeam
      ? `${homeTeam} Win`
      : prediction === 'AWAY_WIN' && awayTeam
      ? `${awayTeam} Win`
      : LABELS[prediction];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border',
        colors.text,
        colors.bg,
        colors.border,
        className
      )}
    >
      {label}
    </span>
  );
}
