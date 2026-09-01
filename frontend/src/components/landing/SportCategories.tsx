'use client';

import React from 'react';
import { Trophy, Flame, Zap, Activity, Shield, Swords, Target, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPORTS = [
  { id: 'soccer', name: 'SOCCER', icon: Trophy, active: true },
  { id: 'nba', name: 'NBA', icon: Flame, active: false, badge: 'Coming Soon' },
  { id: 'nfl', name: 'NFL', icon: Zap, active: false, badge: 'Coming Soon' },
  { id: 'mlb', name: 'MLB', icon: Activity, active: false, badge: 'Coming Soon' },
  { id: 'nhl', name: 'NHL', icon: Shield, active: false, badge: 'Coming Soon' },
  { id: 'mma', name: 'MMA', icon: Swords, active: false, badge: 'Coming Soon' },
  { id: 'tennis', name: 'TENNIS', icon: Target, active: false, badge: 'Coming Soon' },
  { id: 'f1', name: 'F1', icon: Flag, active: false, badge: 'Coming Soon' },
];

export function SportCategories() {
  return (
    <div className="w-full bg-card border-y border-border py-4 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div 
          className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SPORTS.map((sport) => {
            const Icon = sport.icon;
            return (
              <div
                key={sport.id}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-colors duration-150 whitespace-nowrap relative group cursor-pointer",
                  sport.active
                    ? "bg-primary/10 border-[#10b981] text-primary font-bold  "
                    : "bg-card border-border text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", sport.active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="text-xs tracking-wider uppercase font-bold">{sport.name}</span>
                {sport.badge && (
                  <span className="text-[9px] scale-90 origin-left px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium group-hover:bg-muted group-hover:text-foreground/80 transition-colors">
                    {sport.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
