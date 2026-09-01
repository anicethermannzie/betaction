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
                'px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors duration-150 active:scale-[0.97]',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
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
