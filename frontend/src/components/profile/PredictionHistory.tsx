'use client';

import { useState } from 'react';
import { Check, X, Clock, Inbox } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn, formatShortDate } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PredictionRecord {
  id:           number;
  fixtureId:    number;
  homeTeam:     string;
  awayTeam:     string;
  leagueName:   string;
  date:         string;           // 'YYYY-MM-DD'
  prediction:   'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
  probability:  number;           // 0–1
  actualScore?: string;           // e.g. "2-1"; absent when pending
  status:       'correct' | 'incorrect' | 'pending';
}

type Filter = 'all' | 'correct' | 'incorrect' | 'pending';

const PAGE_SIZE = 10;

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PredictionRecord['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap',
        status === 'correct'   ? 'bg-emerald-500/15 text-emerald-400' :
        status === 'incorrect' ? 'bg-red-500/15 text-red-400'         :
                                 'bg-amber-500/15 text-amber-400'
      )}
    >
      {status === 'correct'   ? <Check className="h-2.5 w-2.5" /> :
       status === 'incorrect' ? <X     className="h-2.5 w-2.5" /> :
                                <Clock className="h-2.5 w-2.5" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── PredictionHistoryItem ─────────────────────────────────────────────────────

function PredictionHistoryItem({ record }: { record: PredictionRecord }) {
  const predLabel =
    record.prediction === 'HOME_WIN' ? 'Home Win' :
    record.prediction === 'AWAY_WIN' ? 'Away Win' :
    'Draw';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/50 last:border-0">
      {/* Status icon */}
      <div
        className={cn(
          'mt-0.5 p-1.5 rounded-full shrink-0',
          record.status === 'correct'   ? 'bg-emerald-500/15' :
          record.status === 'incorrect' ? 'bg-red-500/15'     : 'bg-amber-500/15'
        )}
      >
        {record.status === 'correct'   ? <Check className="h-3 w-3 text-emerald-400" /> :
         record.status === 'incorrect' ? <X     className="h-3 w-3 text-red-400"     /> :
                                        <Clock className="h-3 w-3 text-amber-400"    />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">
            {record.homeTeam}{' '}
            <span className="text-muted-foreground font-normal">vs</span>{' '}
            {record.awayTeam}
          </p>
          <StatusBadge status={record.status} />
        </div>

        <p className="text-xs text-muted-foreground mt-0.5">
          {record.leagueName} · {formatShortDate(record.date)}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 mt-1.5">
          <span className="text-xs">
            <span className="text-muted-foreground">Predicted: </span>
            <span className="font-medium">
              {predLabel} {Math.round(record.probability * 100)}%
            </span>
          </span>
          {record.actualScore && (
            <span className="text-xs">
              <span className="text-muted-foreground">Score: </span>
              <span className="font-mono font-semibold">{record.actualScore}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<Filter, string> = {
  all:       'No predictions yet. Start predicting today!',
  correct:   'No correct predictions recorded yet.',
  incorrect: 'No incorrect predictions — well done!',
  pending:   "No pending predictions. Pick a match from today's schedule!",
};

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <Inbox className="h-10 w-10 text-muted-foreground/20" />
      <p className="text-sm text-muted-foreground">{EMPTY_MESSAGES[filter]}</p>
    </div>
  );
}

// ── PredictionHistory ─────────────────────────────────────────────────────────

interface PredictionHistoryProps {
  predictions: PredictionRecord[];
  className?:  string;
}

export function PredictionHistory({ predictions, className }: PredictionHistoryProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [page,   setPage]   = useState(1);

  const filtered =
    filter === 'all'
      ? predictions
      : predictions.filter((p) => p.status === filter);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  function handleFilterChange(value: string) {
    setFilter(value as Filter);
    setPage(1);
  }

  const counts: Record<Filter, number> = {
    all:       predictions.length,
    correct:   predictions.filter((p) => p.status === 'correct').length,
    incorrect: predictions.filter((p) => p.status === 'incorrect').length,
    pending:   predictions.filter((p) => p.status === 'pending').length,
  };

  return (
    <div className={className}>
      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={handleFilterChange}>
        <TabsList className="bg-slate-950/60 border border-slate-800/60 w-full grid grid-cols-4 h-9">
          {(['all', 'correct', 'incorrect', 'pending'] as Filter[]).map((f) => (
            <TabsTrigger
              key={f}
              value={f}
              className="text-xs capitalize data-[state=active]:bg-slate-800 data-[state=active]:text-foreground"
            >
              {f}
              <span className="ml-1 text-[10px] text-muted-foreground/70">
                ({counts[f]})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      <div className="mt-3">
        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            {visible.map((record) => (
              <PredictionHistoryItem key={record.id} record={record} />
            ))}

            {hasMore && (
              <div className="pt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-muted-foreground hover:text-foreground hover:bg-slate-800/50"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
