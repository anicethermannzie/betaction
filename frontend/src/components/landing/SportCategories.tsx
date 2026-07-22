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
    <div className="w-full bg-[#0c1015] border-y border-slate-800/80 py-4 select-none">
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
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-full border transition-all duration-300 whitespace-nowrap relative group cursor-pointer",
                  sport.active
                    ? "bg-[#10b981]/10 border-[#10b981] text-[#10b981] font-black shadow-md shadow-emerald-500/5"
                    : "bg-[#1a2332]/40 border-slate-800/60 text-slate-400 hover:border-slate-700/60 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", sport.active ? "text-[#10b981]" : "text-slate-400 group-hover:text-slate-200")} />
                <span className="text-xs tracking-wider uppercase font-bold">{sport.name}</span>
                {sport.badge && (
                  <span className="text-[9px] scale-90 origin-left px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium group-hover:bg-slate-700 group-hover:text-slate-300 transition-colors">
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
