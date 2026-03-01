import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { POPULAR_LEAGUES } from '@/types';

export function PopularLeaguesGrid() {
  return (
    <section>
      <h2 className="section-title mb-4">Popular Leagues</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {POPULAR_LEAGUES.map((league) => (
          <Link
            key={league.id}
            href={`/leagues/${league.id}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4
                       hover:border-primary/50 hover:bg-primary/5 hover-glow
                       transition-all duration-200"
          >
            {/* Flag */}
            <span
              className="text-3xl leading-none shrink-0"
              role="img"
              aria-label={league.country}
            >
              {league.flag}
            </span>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {league.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{league.country}</p>
            </div>

            {/* Arrow */}
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
