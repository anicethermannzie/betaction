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
        'w-full flex items-center justify-between p-3.5 rounded-lg border text-sm font-semibold transition-all hover:bg-slate-800/80 active:scale-[0.98]',
        isSelected
          ? 'bg-emerald-950/30 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
          : 'bg-[#1e293b] border-slate-700/80 text-slate-200'
      )}
    >
      <span className="truncate pr-2 font-medium">{label}</span>
      <span className={cn(
        'px-2 py-0.5 rounded text-xs border whitespace-nowrap font-bold shrink-0',
        isSelected
          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
          : 'border-slate-600 bg-slate-900/50 text-slate-300'
      )}>
        {formattedOdds}
      </span>
    </button>
  );
}
