'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface UserLeague {
  id:              number;
  name:            string;
  country:         string;
  flag:            string;
  predictionCount: number;
}

interface FavoriteLeaguesProps {
  leagues:    UserLeague[];
  className?: string;
}

export function FavoriteLeagues({ leagues, className }: FavoriteLeaguesProps) {
  const router = useRouter();

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden', className)}>
      {leagues.map((league) => (
        <button
          key={league.id}
          onClick={() => router.push(`/leagues/${league.id}`)}
          className="group bg-card p-4 text-left transition-colors hover:bg-muted/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xl leading-none" role="img" aria-label={league.country}>
              {league.flag}
            </span>
            <span className="num text-[10px] text-muted-foreground/60">
              {league.predictionCount}
            </span>
          </div>
          <p className="text-[13px] font-semibold truncate mt-2 group-hover:text-primary transition-colors">
            {league.name}
          </p>
          <p className="label mt-0.5">{league.country}</p>
        </button>
      ))}
    </div>
  );
}
