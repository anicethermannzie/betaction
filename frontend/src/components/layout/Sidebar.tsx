'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { POPULAR_LEAGUES } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TrendingUp } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-card/50">
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 px-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Popular Leagues
            </span>
          </div>
          <nav className="space-y-1">
            {POPULAR_LEAGUES.map((league) => {
              const href = `/leagues/${league.id}`;
              const active = pathname === href;
              return (
                <Link
                  key={league.id}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground group',
                    active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )}
                >
                  <span className="text-lg leading-none" role="img" aria-label={league.country}>
                    {league.flag}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm">{league.name}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{league.country}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <Separator className="my-3 mx-3" />

        <div className="px-3">
          <p className="px-2 text-[11px] text-muted-foreground">
            Data provided by API-Football
          </p>
        </div>
      </ScrollArea>
    </aside>
  );
}
