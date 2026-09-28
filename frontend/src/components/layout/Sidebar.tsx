'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { POPULAR_LEAGUES } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card">
      <ScrollArea className="flex-1 py-4">
        <div className="px-3">
          <p className="section-title px-2 mb-3">Leagues</p>

          <nav className="space-y-0.5">
            {POPULAR_LEAGUES.map((league) => {
              const href = `/leagues/${league.id}`;
              const active = pathname === href;
              return (
                <Link
                  key={league.id}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 px-2 py-2 border-l-2 transition-colors',
                    active
                      ? 'border-l-primary bg-muted/40 text-foreground'
                      : 'border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  )}
                >
                  <span className="text-base leading-none shrink-0" role="img" aria-label={league.country}>
                    {league.flag}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-[13px]">{league.name}</span>
                    <span className="num text-[10px] text-muted-foreground/70 truncate">{league.country}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-4 border-t border-border pt-3 px-5">
          <p className="label">Data · API-Football</p>
        </div>
      </ScrollArea>
    </aside>
  );
}
