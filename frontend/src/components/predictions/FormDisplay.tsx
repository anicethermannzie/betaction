'use client';

import { cn } from '@/lib/utils';
import type { FormResult } from '@/types';

// ── Result circle ─────────────────────────────────────────────────────────────

function ResultCircle({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-6 h-6 rounded-sm font-mono text-[11px] font-bold shrink-0',
        result === 'W' && 'bg-primary/10 text-primary',
        result === 'D' && 'bg-hold/10 text-hold',
        result === 'L' && 'bg-down/10 text-down'
      )}
    >
      {result}
    </span>
  );
}

// ── Single team form column ───────────────────────────────────────────────────

function TeamForm({ teamName, form }: { teamName: string; form: FormResult[] }) {
  const points = form.reduce(
    (sum, r) => sum + (r.result === 'W' ? 3 : r.result === 'D' ? 1 : 0),
    0
  );
  const maxPoints = form.length * 3;

  return (
    <div className="space-y-3">
      {/* Team name */}
      <p className="text-[13px] font-semibold text-center truncate">{teamName}</p>

      {/* W/D/L ticks */}
      <div className="flex items-center justify-center gap-1">
        {form.map((r, i) => (
          <ResultCircle key={i} result={r.result} />
        ))}
      </div>

      {/* Points */}
      <div className="flex justify-center">
        <span className="num text-[10px] bg-muted rounded-sm px-2 py-0.5 text-muted-foreground">
          {points} / {maxPoints} PTS
        </span>
      </div>

      {/* Match list */}
      <div className="space-y-1.5">
        {form.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'w-4 text-center font-bold shrink-0 text-[11px]',
                r.result === 'W' ? 'text-primary' :
                r.result === 'D' ? 'text-hold'   :
                'text-down'
              )}
            >
              {r.result}
            </span>
            <span className="text-muted-foreground text-[11px] shrink-0">
              {r.isHome ? 'vs' : '@'}
            </span>
            <span className="text-foreground/80 text-[11px] truncate flex-1">
              {r.opponent}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground shrink-0">
              {r.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface FormDisplayProps {
  homeTeam:   string;
  awayTeam:   string;
  homeForm:   FormResult[];
  awayForm:   FormResult[];
  className?: string;
}

export function FormDisplay({ homeTeam, awayTeam, homeForm, awayForm, className }: FormDisplayProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      <TeamForm teamName={homeTeam} form={homeForm} />
      <div className="border-l border-border/40 pl-4">
        <TeamForm teamName={awayTeam} form={awayForm} />
      </div>
    </div>
  );
}
