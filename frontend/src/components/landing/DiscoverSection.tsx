'use client';

import React from 'react';
import { Bot, Ticket, BarChart3, ArrowRight } from 'lucide-react';

const CARDS = [
  {
    title: '🤖 AI Predictions',
    description: 'Our algorithm analyzes 18 betting markets across every match to find the highest-probability picks.',
    icon: Bot,
    targetId: 'predictions',
  },
  {
    title: '🎰 Smart Tickets',
    description: 'Get ready-to-play accumulator tickets at 4 risk levels — from Ultra Safe to Risky. Or build your own.',
    icon: Ticket,
    targetId: 'predictions',
  },
  {
    title: '📊 Deep Analysis',
    description: 'Every prediction backed by team form, head-to-head history, home/away stats, goal ratios, and bookmaker odds.',
    icon: BarChart3,
    targetId: 'how-it-works',
  },
];

export function DiscoverSection() {
  const handleScroll = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="features" className="py-20 bg-[#1a2332] relative overflow-hidden border-t border-slate-900/60 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Discover BetAction
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Next-generation sports forecasting platform powered by ZahTech LLC.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                className="bg-[#0f1419] border border-slate-800/80 hover:border-emerald-500/20 p-8 rounded-2xl flex flex-col justify-between hover-glow transition-all duration-300 group"
              >
                <div className="space-y-6">
                  {/* Icon badge */}
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-[#10b981] group-hover:scale-105 transition-transform duration-300">
                    <Icon className="h-6 w-6 text-[#10b981]" />
                  </div>

                  <h3 className="text-lg font-black text-white uppercase tracking-wide">
                    {card.title}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                    {card.description}
                  </p>
                </div>

                <div className="pt-8 mt-6 border-t border-slate-850/60">
                  <a 
                    href={`#${card.targetId}`}
                    onClick={(e) => handleScroll(e, card.targetId)}
                    className="inline-flex items-center gap-2 text-xs font-black text-[#10b981] hover:text-[#0d9668] uppercase tracking-wider transition-colors"
                  >
                    Learn More
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
