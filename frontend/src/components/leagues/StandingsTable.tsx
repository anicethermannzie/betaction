import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Standing } from '@/types';

interface StandingsTableProps {
  standings: Standing[];
  className?: string;
}

export function StandingsTable({ standings, className }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No standings available.
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Team</th>
            <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">P</th>
            <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">W</th>
            <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">D</th>
            <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">L</th>
            <th className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground">GD</th>
            <th className="px-3 py-2.5 text-center text-xs font-bold text-foreground">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr
              key={row.team.id}
              className={cn(
                'border-b border-border/50 transition-colors hover:bg-accent/30',
                i < 4 && 'border-l-2 border-l-emerald-500',
                i === 4 && 'border-l-2 border-l-amber-500',
                i >= standings.length - 3 && 'border-l-2 border-l-red-500'
              )}
            >
              <td className="px-3 py-2.5 text-muted-foreground font-medium w-8">{row.rank}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {row.team.logo && (
                    <Image
                      src={row.team.logo}
                      alt={row.team.name}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  )}
                  <span className="font-medium truncate max-w-[140px]">{row.team.name}</span>
                </div>
              </td>
              <td className="px-2 py-2.5 text-center text-muted-foreground">{row.all.played}</td>
              <td className="px-2 py-2.5 text-center text-muted-foreground">{row.all.win}</td>
              <td className="px-2 py-2.5 text-center text-muted-foreground">{row.all.draw}</td>
              <td className="px-2 py-2.5 text-center text-muted-foreground">{row.all.lose}</td>
              <td className={cn(
                'px-2 py-2.5 text-center font-medium',
                row.goalsDiff > 0 ? 'text-emerald-500' : row.goalsDiff < 0 ? 'text-red-400' : 'text-muted-foreground'
              )}>
                {row.goalsDiff > 0 ? '+' : ''}{row.goalsDiff}
              </td>
              <td className="px-3 py-2.5 text-center font-bold text-foreground">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
