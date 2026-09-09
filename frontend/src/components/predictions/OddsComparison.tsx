'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchOdds, Prediction } from '@/types';

interface OddsComparisonProps {
  odds:       MatchOdds;
  prediction: Prediction;
  className?: string;
}

const impliedProb = (decimalOdds: number) => 1 / decimalOdds;

interface OddsRowProps {
  code:    string;
  label:   string;
  odds:    number;
  implied: number;
  ourProb: number;
  tone:    string;
}

function OddsRow({ code, label, odds, implied, ourProb, tone }: OddsRowProps) {
  const delta    = ourProb - implied;
  const hasValue = Math.abs(delta) > 0.05;
  const positive = delta > 0;

  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-3 items-center py-2 border-b border-border last:border-0">
      <span className={cn('num text-[11px] w-4 text-center opacity-60', tone)}>{code}</span>
      <span className="text-[13px] text-foreground/85 truncate">{label}</span>
      <span className="num text-[12px] font-semibold w-12 text-right">{odds.toFixed(2)}</span>
      <span className="num text-[12px] w-14 text-right text-muted-foreground">{(implied * 100).toFixed(1)}%</span>
      <span className={cn('num text-[12px] font-semibold w-14 text-right', tone)}>{(ourProb * 100).toFixed(1)}%</span>
      <span className={cn(
        'num text-[10px] font-semibold w-14 text-right flex items-center justify-end gap-0.5',
        !hasValue ? 'text-muted-foreground/40' : positive ? 'text-primary' : 'text-down'
      )}>
        {hasValue && (positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        {(Math.abs(delta) * 100).toFixed(1)}
      </span>
    </div>
  );
}

export function OddsComparison({ odds, prediction, className }: OddsComparisonProps) {
  const rows: OddsRowProps[] = [
    { code: '1', label: prediction.home_team, odds: odds.homeWin, implied: impliedProb(odds.homeWin), ourProb: prediction.home_win, tone: 'text-primary' },
    { code: 'X', label: 'Draw',                odds: odds.draw,    implied: impliedProb(odds.draw),    ourProb: prediction.draw,     tone: 'text-hold' },
    { code: '2', label: prediction.away_team, odds: odds.awayWin, implied: impliedProb(odds.awayWin), ourProb: prediction.away_win, tone: 'text-down' },
  ];

  const predictedRow =
    prediction.prediction === 'HOME_WIN' ? rows[0] :
    prediction.prediction === 'AWAY_WIN' ? rows[2] : rows[1];
  const isValueBet = predictedRow.ourProb - predictedRow.implied >= 0.08;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <p className="label">Book · {odds.bookmaker}</p>
        {isValueBet && (
          <span className="tick bg-primary/10 text-primary">
            <ArrowUp className="h-3 w-3" /> Value
          </span>
        )}
      </div>

      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-3 pb-1 border-b border-border label">
        <span className="w-4" />
        <span>Outcome</span>
        <span className="w-12 text-right">Odds</span>
        <span className="w-14 text-right">Impl</span>
        <span className="w-14 text-right">Model</span>
        <span className="w-14 text-right">Edge</span>
      </div>

      {rows.map((row) => <OddsRow key={row.code} {...row} />)}

      <p className="label pt-1">Odds indicative · not betting advice</p>
    </div>
  );
}
