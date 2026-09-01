import React from 'react';
import { cn } from '@/lib/utils';

interface OddsButtonProps {
  label: string;
  odds: number; // decimal odds
  isSelected: boolean;
  onClick: () => void;
  decimalMode?: boolean;
}

export function OddsButton({ label, odds, isSelected, onClick, decimalMode = false }: OddsButtonProps) {
  // Format decimal to American odds
  const formatAmericanOdds = (dec: number) => {
    if (dec <= 1.0) return 'EV';
    if (dec >= 2.0) {
      return `+${Math.round((dec - 1) * 100)}`;
    } else {
      return `${Math.round(-100 / (dec - 1))}`;
    }
  };

  const formattedOdds = decimalMode ? `${odds.toFixed(2)}` : formatAmericanOdds(odds);

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'w-full flex items-center justify-between p-3.5 rounded-lg border text-sm font-semibold transition-colors hover:bg-muted active:scale-[0.98]',
        isSelected
          ? 'bg-emerald-950/30 border-primary text-primary  '
          : 'bg-card border-border text-foreground'
      )}
    >
      <span className="truncate pr-2 font-medium">{label}</span>
      <span className={cn(
        'px-2 py-0.5 rounded text-xs border whitespace-nowrap font-bold shrink-0',
        isSelected
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border bg-card text-foreground/80'
      )}>
        {formattedOdds}
      </span>
    </button>
  );
}
