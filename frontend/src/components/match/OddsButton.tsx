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
        'w-full flex items-center justify-between p-3 rounded border text-sm transition-colors',
        isSelected
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-card border-border text-foreground hover:border-muted-foreground/40 hover:bg-muted/40'
      )}
    >
      <span className="truncate pr-2">{label}</span>
      <span className={cn(
        'num px-1.5 py-0.5 rounded-sm text-xs border whitespace-nowrap font-semibold shrink-0',
        isSelected
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border text-foreground/80'
      )}>
        {formattedOdds}
      </span>
    </button>
  );
}
