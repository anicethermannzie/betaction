'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Copy, Check, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { cn } from '@/lib/utils';

export function BetSlip() {
  const pathname = usePathname();
  const {
    selections,
    betAmount,
    isExpanded,
    removeSelection,
    clearAll,
    setBetAmount,
    toggleExpanded,
    calculateCombinedOdds,
    calculatePayout,
    copySelectionsToClipboard,
  } = useBetSlipStore();

  const [copied, setCopied] = useState(false);
  const [placed, setPlaced] = useState(false);

  const count = selections.length;
  
  // Hide completely on tickets page
  if (pathname === '/tickets') return null;
  if (count === 0) return null;

  const combinedOdds = calculateCombinedOdds();
  const potentialPayout = calculatePayout();

  // Helper to format American odds
  const formatAmerican = (dec: number): string => {
    if (dec <= 1.0) return 'EV';
    if (dec >= 2.0) {
      return `+${Math.round((dec - 1) * 100)}`;
    } else {
      return `${Math.round(-100 / (dec - 1))}`;
    }
  };

  const handleCopy = () => {
    copySelectionsToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlaceBet = () => {
    setPlaced(true);
    setTimeout(() => {
      setPlaced(false);
      clearAll();
    }, 2500);
  };

  const presetAmounts = [1, 5, 10, 25, 50, 100];

  return (
    <>
      {/* ── STICKY BOTTOM BAR ── */}
      {!isExpanded && (
        <div
          onClick={toggleExpanded}
          className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50 bg-card border border-primary/30 hover:border-primary/60 rounded-full cursor-pointer p-4 flex items-center justify-between text-sm transition-colors ] active:scale-[0.99] select-none"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-foreground">
              {count}
            </span>
            <span className="font-bold text-slate-100 uppercase tracking-wider text-xs">Bet Slip</span>
          </div>

          <div className="text-foreground text-xs font-semibold">
            Stake <span className="font-bold text-slate-100">${betAmount.toFixed(2)}</span> pays{' '}
            <span className="font-bold text-primary">${potentialPayout.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded border border-primary/40 bg-primary/15 text-xs font-bold text-primary">
              {formatAmerican(combinedOdds)}
            </span>
            <ChevronUp className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      {/* ── EXPANDED PANEL ── */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-background flex items-end justify-center">
          {/* Click outside to collapse */}
          <div className="absolute inset-0 cursor-pointer" onClick={toggleExpanded} />

          <div className="relative w-full max-w-lg bg-card border-t border-border rounded-t-3xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250">
            
            {/* Success Message Banner */}
            {placed && (
              <div className="absolute inset-0 bg-background rounded-t-3xl z-50 flex flex-col items-center justify-center p-6 text-center gap-3 animate-in fade-in">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary flex items-center justify-center text-primary text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-slate-100">Bet Placed Successfully!</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Your predictions have been locked in and saved to your profile history. Good luck!
                </p>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-wide">Bet Slip</h2>
                <span className="text-xs bg-muted text-foreground/80 font-bold px-2 py-0.5 rounded-full">
                  {count} Leg{count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearAll}
                  className="text-xs font-bold text-muted-foreground hover:text-down flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Clear All
                </button>
                <button
                  onClick={toggleExpanded}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Selections List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {selections.map((s) => (
                <div
                  key={s.id}
                  className="bg-card border border-border p-3.5 rounded-lg flex items-center justify-between gap-3 hover:border-border transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold text-foreground truncate">{s.matchName}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {s.market} · <span className="text-primary font-semibold">{s.selection}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded">
                      {formatAmerican(s.odds)}
                    </span>
                    <button
                      onClick={() => removeSelection(s.id)}
                      className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Stake Entry */}
            <div className="border-t border-border bg-background p-6 space-y-4 shrink-0">
              
              {/* Quick stakes */}
              <div className="grid grid-cols-6 gap-2">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBetAmount(amount)}
                    className={cn(
                      'py-1.5 rounded-lg border text-xs font-bold transition-colors hover:bg-muted',
                      betAmount === amount
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border text-foreground/80 bg-card'
                    )}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Stake input */}
              <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-lg">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-1">Stake ($)</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={betAmount || ''}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                  className="bg-transparent text-right font-bold text-slate-100 flex-1 outline-none text-sm"
                  placeholder="0.00"
                />
              </div>

              {/* Odds and payout summary */}
              <div className="space-y-2 text-xs font-bold text-muted-foreground px-1 pt-1">
                <div className="flex justify-between">
                  <span>Combined Odds</span>
                  <span className="text-foreground font-bold text-sm">{formatAmerican(combinedOdds)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span>Potential Payout</span>
                  <span className="text-primary font-bold text-base">${potentialPayout.toFixed(2)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                <button
                  onClick={handleCopy}
                  type="button"
                  className="col-span-1 flex items-center justify-center p-3 rounded-lg border border-slate-850 hover:bg-muted text-foreground/80 transition-colors"
                  title="Copy selections as text"
                >
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={handlePlaceBet}
                  type="button"
                  disabled={betAmount <= 0}
                  className="col-span-4 py-3 rounded-lg bg-primary hover:bg-primary disabled:bg-muted text-foreground font-bold tracking-wide text-sm uppercase active:scale-[0.98] transition-colors"
                >
                  Place Bet
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
