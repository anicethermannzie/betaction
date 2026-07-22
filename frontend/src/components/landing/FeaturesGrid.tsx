'use client';

import React from 'react';
import { Layers, Shield, Sliders, RefreshCw, LineChart } from 'lucide-react';

const FEATURES = [
  {
    title: '18 Markets',
    description: 'From Match Result to Correct Score, we analyze everything.',
    icon: Layers,
  },
  {
    title: '4 Risk Levels',
    description: 'Ultra Safe, Safe, Moderate, Risky — pick your style.',
    icon: Shield,
  },
  {
    title: 'Build Your Own',
    description: 'Create custom tickets from our market analysis.',
    icon: Sliders,
  },
  {
    title: 'Real-Time Updates',
    description: 'Live scores and prediction updates as matches happen.',
    icon: RefreshCw,
  },
  {
    title: 'Track Accuracy',
    description: 'See your prediction history and success rate.',
    icon: LineChart,
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-20 bg-[#0f1419] relative overflow-hidden border-t border-slate-900/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Bringing You the Best of Predictions
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Discover why BetAction is the ultimate tool for sport bettors.
          </p>
        </div>

        {/* Features Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={i} 
                className="bg-[#1a2332]/60 hover:bg-[#1a2332]/95 border border-slate-800/80 hover:border-emerald-500/20 p-6 rounded-2xl flex flex-col items-center text-center space-y-4 hover-glow transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#10b981] group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-6 w-6 text-[#10b981]" />
                </div>
                
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {feature.title}
                </h3>
                
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
