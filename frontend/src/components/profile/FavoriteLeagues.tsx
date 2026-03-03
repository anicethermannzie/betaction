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
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
      {leagues.map((league) => (
        <button
          key={league.id}
          onClick={() => router.push(`/leagues/${league.id}`)}
          className={cn(
            'bg-slate-900 border border-slate-800/60 rounded-xl p-4 text-left',
            'hover:border-emerald-500/40 hover:bg-slate-800/60 transition-colors group'
          )}
        >
          {/* Flag / logo area */}
          <div className="text-2xl mb-2 leading-none">{league.flag}</div>

          {/* League name */}
          <p className="text-sm font-semibold truncate group-hover:text-emerald-400 transition-colors">
            {league.name}
          </p>

          {/* Country */}
          <p className="text-xs text-muted-foreground mt-0.5">{league.country}</p>

          {/* Prediction count */}
          <p className="text-xs text-muted-foreground/50 mt-2">
            {league.predictionCount} prediction{league.predictionCount !== 1 ? 's' : ''}
          </p>
        </button>
      ))}
    </div>
  );
}
