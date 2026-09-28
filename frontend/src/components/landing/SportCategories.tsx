'use client';

import React from 'react';
import { Trophy, Flame, Zap, Activity, Shield, Swords, Target, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPORTS = [
  { id: 'soccer', name: 'Soccer', icon: Trophy, active: true },
  { id: 'nba',    name: 'NBA',    icon: Flame,  active: false },
  { id: 'nfl',    name: 'NFL',    icon: Zap,    active: false },
  { id: 'mlb',    name: 'MLB',    icon: Activity, active: false },
  { id: 'nhl',    name: 'NHL',    icon: Shield, active: false },
  { id: 'mma',    name: 'MMA',    icon: Swords, active: false },
  { id: 'tennis', name: 'Tennis', icon: Target, active: false },
  { id: 'f1',     name: 'F1',     icon: Flag,   active: false },
];

export function SportCategories() {
  return (
    <div className="w-full bg-card border-y border-border select-none">
      <div
        className="max-w-7xl mx-auto flex items-stretch divide-x divide-border overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {SPORTS.map(({ id, name, icon: Icon, active }) => (
          <div
            key={id}
            className={cn(
              'flex items-center gap-2 px-5 py-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-label border-b-2',
              active
                ? 'text-primary border-b-primary'
                : 'text-muted-foreground/70 border-b-transparent'
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {name}
            {!active && <span className="text-muted-foreground/40">soon</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
