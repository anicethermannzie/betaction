'use client';

import React from 'react';
import Link from 'next/link';
import { Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const COLUMNS: { heading: string; links: { label: string; href?: string }[] }[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Predictions', href: '#predictions' },
      { label: 'Tickets', href: '#predictions' },
      { label: 'Markets', href: '#features' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About ZahTech', href: 'https://zahtech.org' },
      { label: 'Careers' },
      { label: 'Contact' },
      { label: 'Blog' },
      { label: 'Press' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service' },
      { label: 'Privacy Policy' },
      { label: 'Responsible Gambling' },
      { label: 'Cookie Policy' },
    ],
  },
];

const SOCIALS = [
  { label: 'Twitter', icon: Twitter },
  { label: 'Instagram', icon: Instagram },
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'YouTube', icon: Youtube },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-background border-t border-border text-muted-foreground py-14 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-sm bg-primary" />
              <span className="font-mono text-sm font-bold tracking-tight text-foreground">
                BET<span className="text-primary">ACTION</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-xs">
              AI-powered football predictions. Model probabilities, bookmaker odds,
              and the edge between them — generated in real time.
            </p>
            <a
              href="https://zahtech.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-label text-foreground/80 hover:border-primary/40 hover:text-foreground transition-colors"
            >
              Built by <span className="text-foreground">ZahTech LLC</span>
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="space-y-3">
              <h4 className="label">{col.heading}</h4>
              <ul className="space-y-2 text-xs">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a
                        href={link.href}
                        {...(link.href.startsWith('http')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <span className="hover:text-foreground cursor-pointer transition-colors">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Socials + disclosure */}
        <div className="border-t border-border pt-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="label">Powered by</span>
              <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-label text-foreground">
                ZahTech
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-[11px] leading-relaxed text-muted-foreground/70">
            <span className="label block mb-1">Disclaimer &amp; responsibility</span>
            BetAction is a prediction tool for informational purposes. We do not accept
            bets, process payments, or operate as a sportsbook. Sports predictions carry
            inherent risk — bet responsibly and check your local laws before wagering.
          </div>
        </div>

        <div className="border-t border-border pt-6 mt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-muted-foreground/60">
          <p className="num">© {currentYear} ZahTech LLC. All rights reserved.</p>
          <p className="text-center">Availability varies by jurisdiction · Not a sportsbook · No payments processed</p>
        </div>

      </div>
    </footer>
  );
}
