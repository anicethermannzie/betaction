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
    <div className="w-full border-b border-border bg-card sticky top-[9.5rem] z-30">
      <div
        className="flex overflow-x-auto px-4 scrollbar-none"
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
                'px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-label whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-muted-foreground hover:text-foreground'
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
