import React from 'react';
import { cn } from '@/lib/utils';
import type { MarketCategory } from '@/types';

interface MarketTabsProps {
  activeTab: MarketCategory;
  onChange: (tab: MarketCategory) => void;
}

const CATEGORIES: MarketCategory[] = ['All', 'SGP', 'Totals', 'Corners', 'Halftime', 'Spreads', 'Correct Score'];

export function MarketTabs({ activeTab, onChange }: MarketTabsProps) {
  return (
    <div className="w-full border-b border-slate-800 bg-slate-900/40 sticky top-[9.5rem] z-30 backdrop-blur-sm">
      <div
        className="flex gap-2 overflow-x-auto px-4 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              type="button"
              className={cn(
                'px-4 py-2.5 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-150 active:scale-[0.97]',
                isActive
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
