'use client';

import React from 'react';

const STATS = [
  { value: '10,000+', label: 'Active users' },
  { value: '85%',     label: 'Peak accuracy' },
  { value: '18',      label: 'Markets modelled' },
  { value: '50+',     label: 'Leagues covered' },
];

export function StatsBar() {
  return (
    <section className="bg-card border-t border-border select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
        {STATS.map((stat) => (
          <div key={stat.label} className="px-6 py-10 text-center">
            <p className="num text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {stat.value}
            </p>
            <p className="label mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
