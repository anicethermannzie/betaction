'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  { n: '1', title: 'Sign up free',            body: 'Create your account in 30 seconds. No card needed.' },
  { n: '2', title: "Read today's board",      body: 'The model rates every match and builds tickets at four risk levels.' },
  { n: '3', title: 'Copy & play',             body: 'Take the ticket to your sportsbook and place the bet.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-background border-t border-border scroll-mt-14">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="max-w-2xl mb-12 space-y-2">
          <p className="section-title">Getting started</p>
          <h2 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How it works
          </h2>
          <p className="text-sm text-muted-foreground">
            Betting smarter in minutes — three steps.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {STEPS.map(({ n, title, body }) => (
            <li key={n} className="bg-card p-6 space-y-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-border font-mono text-sm font-bold text-primary">
                {n}
              </span>
              <h3 className="font-mono text-[13px] font-semibold uppercase tracking-wide text-foreground">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wider text-[13px] rounded transition-colors"
          >
            Start free trial
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>

      </div>
    </section>
  );
}
