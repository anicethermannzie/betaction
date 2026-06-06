'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { generateMarketsForMatch } from '@/lib/mockData';
import { useBetSlipStore } from '@/stores/betSlipStore';
import { OddsButton } from '@/components/match/OddsButton';
import type { ApiFixture, Prediction } from '@/types';

interface MatchMarketPreviewProps {
  match: ApiFixture;
  prediction?: Prediction;
}

export function MatchMarketPreview({ match, prediction }: MatchMarketPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { selections, addSelection, removeSelection } = useBetSlipStore();

  const matchName = `${match.teams.home.name} vs ${match.teams.away.name}`;

  // Generate all markets for this match
  const allMarkets = useMemo(() => {
    return generateMarketsForMatch(
      match.fixture.id,
      match.teams.home.name,
      match.teams.away.name,
      prediction?.markets
    );
  }, [match, prediction]);

  // Extract the top 5 popular markets
  const popularMarkets = useMemo(() => {
    if (allMarkets.length === 0) return [];

    const result: { id: string; name: string; options: any[] }[] = [];

    // 1. Match Result (1X2)
    const matchResult = allMarkets.find((m) => m.id === 'match_result_1x2');
    if (matchResult) {
      result.push({
        id: 'match_result_1x2',
        name: 'Match Result (1X2)',
        options: matchResult.options,
      });
    }

    // 2. Over/Under 2.5 Goals (from total_goals_match)
    const totalGoals = allMarkets.find((m) => m.id === 'total_goals_match');
    if (totalGoals) {
      const ou25Options = totalGoals.options.filter(
        (opt) => opt.name === 'Over 2.5' || opt.name === 'Under 2.5'
      );
      result.push({
        id: 'total_goals_2_5',
        name: 'Over/Under 2.5 Goals',
        options: ou25Options,
      });
    }

    // 3. BTTS (Yes/No)
    const btts = allMarkets.find((m) => m.id === 'btts');
    if (btts) {
      result.push({
        id: 'btts',
        name: 'Both Teams to Score',
        options: btts.options,
      });
    }

    // 4. Double Chance
    const doubleChance = allMarkets.find((m) => m.id === 'double_chance');
    if (doubleChance) {
      result.push({
        id: 'double_chance',
        name: 'Double Chance',
        options: doubleChance.options,
      });
    }

    // 5. Correct Score (top 3 most likely, i.e., lowest decimal odds)
    const correctScore = allMarkets.find((m) => m.id === 'correct_score');
    if (correctScore) {
      const top3Scores = [...correctScore.options]
        .sort((a, b) => a.decimalOdds - b.decimalOdds)
        .slice(0, 3);
      result.push({
        id: 'correct_score_top_3',
        name: 'Correct Score (Top 3 Likely)',
        options: top3Scores,
      });
    }

    return result;
  }, [allMarkets]);

  const handleToggleSelection = (marketName: string, selectionName: string, odds: number) => {
    const selectionId = `${match.fixture.id}:${marketName}`;
    const existing = selections.find((s) => s.id === selectionId);
    
    if (existing && existing.selection === selectionName) {
      removeSelection(selectionId);
    } else {
      addSelection(
        match.fixture.id,
        matchName,
        marketName,
        selectionName,
        odds
      );
    }
  };

  const isOptionSelected = (marketName: string, selectionName: string) => {
    const selectionId = `${match.fixture.id}:${marketName}`;
    const existing = selections.find((s) => s.id === selectionId);
    return existing ? existing.selection === selectionName : false;
  };

  return (
    <div className="bg-card/40 border border-border/80 rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/20">
      {/* Clickable Header Card */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* League and Teams Info */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {match.league.logo && (
                <Image
                  src={match.league.logo}
                  alt={match.league.name}
                  width={14}
                  height={14}
                  className="object-contain opacity-70 shrink-0"
                />
              )}
              <span className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-wider max-w-[150px]">
                {match.league.name}
              </span>
            </div>
            
            <h4 className="text-sm font-bold text-foreground truncate">
              {match.teams.home.name} <span className="text-muted-foreground font-normal">vs</span> {match.teams.away.name}
            </h4>
          </div>
        </div>
 
        {/* Kickoff / Status */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs font-semibold text-muted-foreground">
            {formatTime(match.fixture.date)}
          </span>
          <div className="text-muted-foreground p-1 hover:text-foreground transition-colors">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>
 
      {/* Expanded Quick Markets Block */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-background/20 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-3">
            {popularMarkets.map((market) => (
              <div key={market.id} className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">
                  {market.name}
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {market.options.map((opt) => {
                    const isSelected = isOptionSelected(market.name, opt.name);
                    return (
                      <OddsButton
                        key={opt.name}
                        label={opt.name}
                        odds={opt.decimalOdds}
                        isSelected={isSelected}
                        onClick={() => handleToggleSelection(market.name, opt.name, opt.decimalOdds)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* See all 18 markets CTA */}
          <div className="pt-2 flex justify-end">
            <Link
              href={`/predictions/${match.fixture.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary font-black uppercase tracking-wider hover:text-primary-hover active:scale-[0.98] transition-all bg-primary/10 border border-primary/20 hover:bg-primary/15 rounded-lg px-3 py-2"
            >
              See all 18 markets
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
