'use client';

import React from 'react';

const STATS = [
  { value: '10,000+', label: 'Active Users' },
  { value: '85%', label: 'Prediction Accuracy' },
  { value: '18', label: 'Markets Analyzed' },
  { value: '50+', label: 'Leagues Covered' },
];

export function StatsBar() {
  return (
    <section className="py-16 bg-[#0c1015] border-t border-slate-900/60 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
          {STATS.map((stat, i) => (
            <div key={i} className="space-y-2 group">
              <p className="text-4xl md:text-5xl font-black text-white group-hover:text-[#10b981] transition-colors duration-300 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-widest">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
