'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Ticket as TicketIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { cn, getTodayString } from '@/lib/utils';
import { useTickets } from '@/hooks/useTickets';
import { TicketCard } from '@/components/tickets/TicketCard';
import { TierSelector, TIER_META } from '@/components/tickets/TierSelector';
import { VIPTeaser } from '@/components/tickets/VIPTeaser';
import { MatchMarketPreview } from '@/components/tickets/MatchMarketPreview';
import { CustomTicketBuilder } from '@/components/tickets/CustomTicketBuilder';
import { matchApi, predictionApi } from '@/lib/api';
import { MOCK_TODAY, MOCK_PREDICTIONS } from '@/lib/mockData';
import type { TicketTierKey, ApiFixture, Prediction } from '@/types';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketsPage() {
  const {
    tickets,
    visibleTickets,
    selectedTier,
    isLoading,
    error,
    fetchTodayTickets,
    filterByTier,
    isSaved,
    toggleSave,
  } = useTickets();

  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  useEffect(() => {
    setIsLoadingMatches(true);
    Promise.allSettled([
      matchApi.byDate(getTodayString()),
      predictionApi.today(),
    ]).then(([matchRes, predRes]) => {
      let list: ApiFixture[] = [];
      if (matchRes.status === 'fulfilled') {
        const d = matchRes.value.data;
        if (d) {
          if (Array.isArray(d.response)) {
            list = d.response;
          } else {
            const clubList = Array.isArray(d.club) ? d.club : [];
            const intList = Array.isArray(d.international) ? d.international : [];
            list = [...clubList, ...intList];
          }
        }
      }
      setFixtures(list.length > 0 ? list : MOCK_TODAY);

      let predList: Prediction[] = [];
      if (predRes.status === 'fulfilled') {
        const d = predRes.value.data;
        predList = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
      }
      setPredictions(predList.length > 0 ? predList : MOCK_PREDICTIONS);
    }).finally(() => {
      setIsLoadingMatches(false);
    });
  }, []);

  const predictionMap = useMemo(() => {
    return new Map(predictions.map((p) => [p.fixture_id, p]));
  }, [predictions]);

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  // Group visible tickets by tier for section headers
  const tierOrder: TicketTierKey[] = ['ultra_safe', 'safe', 'moderate', 'risky'];
  const groupedTickets = tierOrder.map((tier) => ({
    tier,
    meta: TIER_META[tier],
    items: visibleTickets.filter((t) => t.tier === tier),
  })).filter((g) => g.items.length > 0);

  return (
    <main className="min-h-screen">
      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-background to-card/30">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl -translate-y-1/2" />
          <div className="absolute top-0 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl -translate-y-1/2" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              {/* Label chip */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-4">
                <TicketIcon className="h-3.5 w-3.5" />
                AI-Generated Betting Tickets
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                Today&apos;s Betting Tickets
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-xl">
                AI-generated parlays based on statistical analysis. Pick your risk level and explore curated combinations.
              </p>
              <p className="mt-1 text-sm text-muted-foreground/60">{today}</p>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => fetchTodayTickets()}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border/60',
                'hover:border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground',
                'transition-all duration-150 shrink-0 self-start sm:self-auto',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              {isLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Disclaimer */}
          <p className="mt-5 text-[11px] text-muted-foreground/50 italic max-w-2xl">
            For entertainment purposes only. Please gamble responsibly. Past performance does not guarantee future results.
            All odds and probabilities are estimates generated by AI algorithms.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

        {/* ── SECTION 1: AI Predictions — Today's Tickets ── */}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
              🤖 AI Predictions — Today&apos;s Tickets
            </h2>
            <p className="text-sm text-slate-400">
              Our algorithm analyzed 18 markets across all matches to build these tickets
            </p>
          </div>

          {/* ── Tier Selector ── */}
          <TierSelector
            tickets={tickets}
            selectedTier={selectedTier}
            onSelect={filterByTier}
          />

          {/* ── Error state ── */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to load tickets — showing cached predictions.</span>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          )}

          {/* ── Ticket sections ── */}
          {!isLoading && (
            selectedTier === 'all'
              ? (
                // Grouped by tier with section headers
                <div className="space-y-10">
                  {groupedTickets.map(({ tier, meta, items }) => (
                    <section key={tier}>
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl">{meta.emoji}</span>
                        <div>
                          <h2 className={cn('text-base font-bold', meta.color)}>{meta.label}</h2>
                          <p className="text-xs text-muted-foreground">{meta.range}</p>
                        </div>
                        <span className={cn(
                          'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
                          meta.activeColor, meta.color,
                        )}>
                          {items.length} ticket{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {items.map((ticket) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            isSaved={isSaved(ticket.id)}
                            onSave={toggleSave}
                          />
                        ))}
                      </div>
                    </section>
                  ))}

                  {groupedTickets.length === 0 && (
                    <EmptyState />
                  )}
                </div>
              )
              : (
                // Flat list for single-tier view
                <div className="space-y-4">
                  {visibleTickets.length > 0
                    ? visibleTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        isSaved={isSaved(ticket.id)}
                        onSave={toggleSave}
                        defaultExpanded={visibleTickets.length === 1}
                      />
                    ))
                    : <EmptyState />
                  }
                </div>
              )
          )}
        </section>

        {/* ── SECTION 2: Build Your Own Ticket ── */}
        <section className="space-y-6 pt-8 border-t border-slate-800/80">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
              🛠️ Build Your Own Ticket
            </h2>
            <p className="text-sm text-slate-400">
              Browse today&apos;s matches, pick your selections, and create your custom ticket
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Matches list */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 pl-2 border-l-2 border-emerald-500 mb-3">
                Today&apos;s Matches
              </h3>
              {isLoadingMatches ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-slate-900/30 border border-slate-800/60 animate-pulse" />
                  ))}
                </div>
              ) : fixtures.length === 0 ? (
                <div className="text-center py-10 border border-slate-800/60 rounded-xl bg-slate-900/10">
                  <p className="text-xs text-slate-400 font-medium">No matches scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fixtures.map((match) => (
                    <MatchMarketPreview
                      key={match.fixture.id}
                      match={match}
                      prediction={predictionMap.get(match.fixture.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Custom Ticket builder block */}
            <div className="lg:col-span-1 lg:sticky lg:top-24">
              <CustomTicketBuilder />
            </div>
          </div>
        </section>

        {/* ── SECTION 3: VIP Teaser ── */}
        <VIPTeaser />

      </div>
    </main>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <TicketIcon className="h-10 w-10 text-muted-foreground/40 mb-4" />
      <p className="text-sm font-medium text-muted-foreground">No tickets available for this tier today.</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Try another tier or refresh the page.</p>
    </div>
  );
}
