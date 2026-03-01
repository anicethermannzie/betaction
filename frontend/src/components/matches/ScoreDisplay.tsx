import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ApiFixture } from '@/types';

interface ScoreDisplayProps {
  fixture: ApiFixture;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { logo: 24, text: 'text-lg', name: 'text-xs' },
  md: { logo: 32, text: 'text-2xl', name: 'text-sm' },
  lg: { logo: 48, text: 'text-4xl', name: 'text-base' },
};

export function ScoreDisplay({ fixture, size = 'md', className }: ScoreDisplayProps) {
  const { fixture: f, teams, goals } = fixture;
  const isLive     = ['1H', '2H', 'HT', 'ET', 'P'].includes(f.status.short);
  const isFinished = ['FT', 'AET', 'PEN'].includes(f.status.short);
  const hasScore   = goals.home !== null && goals.away !== null;
  const cfg = sizeMap[size];

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {/* Home team */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {teams.home.logo && (
          <Image
            src={teams.home.logo}
            alt={teams.home.name}
            width={cfg.logo}
            height={cfg.logo}
            className="object-contain"
          />
        )}
        <span className={cn('font-semibold text-center leading-tight', cfg.name)}>
          {teams.home.name}
        </span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
        {hasScore || isFinished ? (
          <div className={cn('font-bold tabular-nums', cfg.text, isLive ? 'text-primary' : 'text-foreground')}>
            {goals.home ?? 0} — {goals.away ?? 0}
          </div>
        ) : (
          <div className={cn('font-medium text-muted-foreground', cfg.text)}>vs</div>
        )}
        <span className="text-[11px] text-muted-foreground">
          {isFinished ? 'FT' : f.status.short}
        </span>
      </div>

      {/* Away team */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {teams.away.logo && (
          <Image
            src={teams.away.logo}
            alt={teams.away.name}
            width={cfg.logo}
            height={cfg.logo}
            className="object-contain"
          />
        )}
        <span className={cn('font-semibold text-center leading-tight', cfg.name)}>
          {teams.away.name}
        </span>
      </div>
    </div>
  );
}
