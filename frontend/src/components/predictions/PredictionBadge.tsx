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

const GLYPH: Record<Prediction['prediction'], string> = {
  HOME_WIN: '1',
  DRAW:     'X',
  AWAY_WIN: '2',
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
    <span className={cn('tick border', colors.text, colors.bg, colors.border, className)}>
      <span className="opacity-60">{GLYPH[prediction]}</span>
      {label}
    </span>
  );
}
