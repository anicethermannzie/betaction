'use client';

import React, { useState } from 'react';
import { Copy, Check, Trash2, Bookmark, Info, Sparkles } from 'lucide-react';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { cn } from '@/lib/utils';

export function CustomTicketBuilder() {
  const {
    selections,
    removeSelection,
    clearAll,
    calculateCombinedOdds,
    calculateRiskLevel,
    formatTicketAsText,
    saveTicketToHistory,
  } = useBetSlipStore();

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const legsCount = selections.length;
  const combinedOdds = calculateCombinedOdds();
  const combinedProb = combinedOdds > 0 ? 1 / combinedOdds : 0;
  const riskLevel = calculateRiskLevel(combinedProb);

  const riskMeta = {
    ultra_safe: { label: 'Ultra Safe', emoji: '🟢', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    safe: { label: 'Safe', emoji: '🔵', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    moderate: { label: 'Moderate', emoji: '🟡', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    risky: { label: 'Risky', emoji: '🔴', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  };

  const handleCopy = () => {
    const text = formatTicketAsText();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    saveTicketToHistory();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (legsCount === 0) {
    return (
      <div className="bg-card/30 border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[350px] transition-all duration-300">
        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-4 animate-pulse">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-base font-extrabold text-foreground">Your Custom Ticket</h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-[260px] leading-relaxed">
          No selections yet. Browse matches above and add selections to build your ticket.
        </p>
      </div>
    );
  }

  const activeRisk = riskMeta[riskLevel];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-2xl transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
        <div>
          <h3 className="text-base font-black text-foreground tracking-wide">Your Custom Ticket</h3>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
            {legsCount} Leg{legsCount > 1 ? 's' : ''} Selected
          </p>
        </div>
        
        {/* Risk Badge */}
        <span className={cn('text-xs font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all duration-300', activeRisk.color)}>
          <span>{activeRisk.emoji}</span>
          <span>{activeRisk.label}</span>
        </span>
      </div>

      {/* Selections List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 mb-5 scrollbar-thin">
        {selections.map((s) => (
          <div
            key={s.id}
            className="bg-card/70 border border-border p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-primary/20 transition-all duration-150 animate-in fade-in duration-200"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-extrabold text-foreground truncate">{s.matchName}</p>
              <p className="text-[11px] font-medium text-muted-foreground">
                {s.market} · <span className="text-primary font-semibold">{s.selection}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-black text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded">
                @{s.odds.toFixed(2)}
              </span>
              <button
                onClick={() => removeSelection(s.id)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Remove selection"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Calculations Summary */}
      <div className="border-t border-border bg-background/40 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-4">
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-bold text-muted-foreground">
          <div className="bg-card/50 border border-border p-2.5 rounded-lg flex flex-col justify-between gap-1">
            <span>Combined Odds</span>
            <span className="text-foreground font-black text-base">
              {combinedOdds.toFixed(2)}
            </span>
          </div>

          <div className="bg-card/50 border border-border p-2.5 rounded-lg flex flex-col justify-between gap-1">
            <span>Potential Return</span>
            <span className="text-primary font-black text-base">
              ${combinedOdds.toFixed(2)} <span className="text-[10px] font-medium text-muted-foreground">per $1</span>
            </span>
          </div>

          <div className="bg-card/50 border border-border p-2.5 rounded-lg flex flex-col justify-between gap-1 col-span-2">
            <div className="flex items-center justify-between">
              <span>Confidence Estimate</span>
              <span className="text-foreground font-black">
                {(combinedProb * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-1.5 overflow-hidden border border-border">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, combinedProb * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Copy Ticket */}
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-extrabold text-xs active:scale-[0.98] transition-all"
            title="Copy ticket as text"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                Copy
              </>
            )}
          </button>

          {/* Save Ticket */}
          <button
            onClick={handleSave}
            type="button"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-extrabold text-xs active:scale-[0.98] transition-all"
            title="Save parlay to profile history"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
                Save
              </>
            )}
          </button>

          {/* Clear All */}
          <button
            onClick={clearAll}
            type="button"
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-950/20 bg-card hover:bg-red-950/10 text-red-400 font-extrabold text-xs active:scale-[0.98] transition-all"
            title="Clear all selections"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>

      </div>

    </div>
  );
}
