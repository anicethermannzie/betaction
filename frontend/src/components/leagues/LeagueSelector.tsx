'use client';

import { useRouter, usePathname } from 'next/navigation';
import { POPULAR_LEAGUES } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeagueSelectorProps {
  selectedId?: number;
  onChange?: (leagueId: number) => void;
  className?: string;
}

export function LeagueSelector({ selectedId, onChange, className }: LeagueSelectorProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const handleSelect = (id: number) => {
    if (onChange) {
      onChange(id);
    } else {
      router.push(`/leagues/${id}`);
    }
  };

  return (
    <ScrollArea className={cn('w-full', className)}>
      <div className="flex items-center gap-2 pb-2">
        {POPULAR_LEAGUES.map((league) => {
          const active = selectedId === league.id || pathname === `/leagues/${league.id}`;
          return (
            <button
              key={league.id}
              onClick={() => handleSelect(league.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors border',
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
              )}
            >
              <span className="text-base" role="img" aria-label={league.country}>
                {league.flag}
              </span>
              <span>{league.name}</span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
