'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { MatchCard } from './MatchCard';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import type { ApiFixture } from '@/types';

interface MatchListProps {
  fixtures: ApiFixture[];
  isLoading?: boolean;
  groupByLeague?: boolean;
}

export function MatchList({ fixtures, isLoading, groupByLeague = false }: MatchListProps) {
  const groups = useMemo(() => {
    if (groupByLeague) {
      return fixtures.reduce<Record<string, ApiFixture[]>>((acc, f) => {
        const key = `${f.league.name} — ${f.league.country}`;
        (acc[key] ??= []).push(f);
        return acc;
      }, {});
    }
    // Group by date
    return fixtures.reduce<Record<string, ApiFixture[]>>((acc, f) => {
      const key = format(parseISO(f.fixture.date), 'eeee, MMMM d');
      (acc[key] ??= []).push(f);
      return acc;
    }, {});
  }, [fixtures, groupByLeague]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="match" />
        ))}
      </div>
    );
  }

  if (fixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">No matches found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([label, items]) => (
        <div key={label}>
          <h3 className="section-title mb-3">{label}</h3>
          <div className="space-y-2">
            {items.map((f) => (
              <MatchCard key={f.fixture.id} fixture={f} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
