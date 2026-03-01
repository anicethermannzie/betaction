'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfidenceMeter } from '@/components/predictions/ConfidenceMeter';
import { formatProbability, getPredictionColors } from '@/lib/utils';
import type { Prediction } from '@/types';

interface HeroSectionProps {
  prediction: Prediction;
  homeLogo?:  string;
  awayLogo?:  string;
}

const OUTCOME_LABEL: Record<Prediction['prediction'], string> = {
  HOME_WIN: 'Win',
  DRAW:     'Draw',
  AWAY_WIN: 'Win',
};

function TeamColumn({
  name,
  logo,
  probability,
  highlighted,
}: {
  name:        string;
  logo?:       string;
  probability: number;
  highlighted: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      {/* Logo */}
      <div className="relative flex items-center justify-center h-16 w-16">
        {logo ? (
          <Image
            src={logo}
            alt={name}
            width={60}
            height={60}
            className="object-contain drop-shadow-xl"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-slate-700/60 flex items-center justify-center text-2xl font-bold text-slate-300">
            {name[0]}
          </div>
        )}
        {highlighted && (
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
        )}
      </div>

      {/* Name */}
      <span className="text-sm font-semibold text-foreground text-center leading-tight max-w-[100px] truncate">
        {name}
      </span>

      {/* Probability */}
      <span
        className={`text-3xl font-black tabular-nums ${
          highlighted ? 'text-primary' : 'text-muted-foreground/70'
        }`}
      >
        {formatProbability(probability)}
      </span>
    </div>
  );
}

export function HeroSection({ prediction, homeLogo, awayLogo }: HeroSectionProps) {
  const colors = getPredictionColors(prediction.prediction);

  const predictedName =
    prediction.prediction === 'HOME_WIN'
      ? prediction.home_team
      : prediction.prediction === 'AWAY_WIN'
      ? prediction.away_team
      : null;

  const outcomeLabel = OUTCOME_LABEL[prediction.prediction];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50">
      {/* Layered gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-900/95 to-blue-950/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />

      {/* Ambient glow orbs */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        {/* Header label */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Featured Prediction
          </span>
        </div>

        {/* Teams + score layout */}
        <div className="flex items-center justify-between gap-2 mb-8">
          {/* Home team */}
          <TeamColumn
            name={prediction.home_team}
            logo={homeLogo}
            probability={prediction.home_win}
            highlighted={prediction.prediction === 'HOME_WIN'}
          />

          {/* Centre divider */}
          <div className="flex flex-col items-center gap-3 shrink-0 px-2">
            <span className="text-2xl font-bold text-muted-foreground/30">vs</span>

            {/* Outcome badge */}
            <div
              className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${colors.text} ${colors.bg} ${colors.border}`}
            >
              {prediction.prediction === 'DRAW'
                ? `Draw · ${formatProbability(prediction.draw)}`
                : `${predictedName} ${outcomeLabel}`}
            </div>
          </div>

          {/* Away team */}
          <TeamColumn
            name={prediction.away_team}
            logo={awayLogo}
            probability={prediction.away_win}
            highlighted={prediction.prediction === 'AWAY_WIN'}
          />
        </div>

        {/* Tri-color probability bar */}
        <div className="mb-6">
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            <div
              className="bg-emerald-500 rounded-l-full transition-all duration-700"
              style={{ width: `${prediction.home_win * 100}%` }}
            />
            <div
              className="bg-amber-400 transition-all duration-700"
              style={{ width: `${prediction.draw * 100}%` }}
            />
            <div
              className="bg-red-400 rounded-r-full transition-all duration-700"
              style={{ width: `${prediction.away_win * 100}%` }}
            />
          </div>
          {/* Labels under bar */}
          <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground/70">
            <span>{prediction.home_team}</span>
            <span>Draw</span>
            <span>{prediction.away_team}</span>
          </div>
        </div>

        {/* Confidence + CTA row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0 max-w-xs">
            <ConfidenceMeter confidence={prediction.confidence} />
          </div>
          <Button asChild size="sm" className="shrink-0 gap-1.5">
            <Link href={`/predictions/${prediction.fixture_id}`}>
              View Full Prediction
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
