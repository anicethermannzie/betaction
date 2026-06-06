import { create } from 'zustand';
import type { Ticket, TicketTierKey } from '@/types';
import { useProfileStore } from './profileStore';

export interface BetSelection {
  id: string; // unique key in format "matchId:market"
  matchId: number;
  matchName: string;
  market: string;
  selection: string;
  odds: number; // decimal odds
}

interface BetSlipState {
  selections: BetSelection[];
  betAmount: number;
  isExpanded: boolean;
  addSelection: (matchId: number, matchName: string, market: string, selection: string, odds: number) => void;
  removeSelection: (selectionId: string) => void;
  clearAll: () => void;
  setBetAmount: (amount: number) => void;
  toggleExpanded: () => void;
  calculateCombinedOdds: () => number;
  calculatePayout: () => number;
  copySelectionsToClipboard: () => string;
  getEstimatedProbability: (odds: number) => number;
  calculateRiskLevel: (combinedProbability: number) => TicketTierKey;
  formatTicketAsText: () => string;
  saveTicketToHistory: () => void;
}

export const useBetSlipStore = create<BetSlipState>((set, get) => ({
  selections: [],
  betAmount: 10, // default to $10.00
  isExpanded: false,

  addSelection: (matchId, matchName, market, selection, odds) => {
    const id = `${matchId}:${market}`;
    const newSelection: BetSelection = { id, matchId, matchName, market, selection, odds };

    set((state) => {
      // Cannot add two selections from same market in same match (replaces previous one)
      const filtered = state.selections.filter((s) => s.id !== id);
      
      if (filtered.length >= 15) {
        // Limit to max 15 selections
        return state;
      }

      return {
        selections: [...filtered, newSelection],
        // Automatically expand the slip on the very first selection
        isExpanded: state.selections.length === 0 ? true : state.isExpanded,
      };
    });
  },

  removeSelection: (selectionId) => {
    set((state) => ({
      selections: state.selections.filter((s) => s.id !== selectionId),
    }));
  },

  clearAll: () => {
    set({ selections: [] });
  },

  setBetAmount: (amount) => {
    set({ betAmount: amount });
  },

  toggleExpanded: () => {
    set((state) => ({ isExpanded: !state.isExpanded }));
  },

  calculateCombinedOdds: () => {
    const { selections } = get();
    if (selections.length === 0) return 0;
    return selections.reduce((total, s) => total * s.odds, 1.0);
  },

  calculatePayout: () => {
    const { betAmount } = get();
    const combinedOdds = get().calculateCombinedOdds();
    return betAmount * combinedOdds;
  },

  copySelectionsToClipboard: () => {
    const { selections } = get();
    if (selections.length === 0) return 'No selections';
    
    // Format selections into readable text
    const text = selections
      .map((s, index) => {
        // Convert decimal back to American formatted string for text sharing
        let amOdds = 'EV';
        if (s.odds >= 2.0) {
          amOdds = `+${Math.round((s.odds - 1) * 100)}`;
        } else if (s.odds > 1.0) {
          amOdds = `${Math.round(-100 / (s.odds - 1))}`;
        }
        return `${index + 1}. ${s.matchName}\n   Market: ${s.market}\n   Selection: ${s.selection} (${amOdds})`;
      })
      .join('\n\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    return text;
  },

  getEstimatedProbability: (odds) => {
    return odds > 0 ? 1 / odds : 0;
  },

  calculateRiskLevel: (combinedProbability) => {
    if (combinedProbability > 0.60) return 'ultra_safe';
    if (combinedProbability > 0.40) return 'safe';
    if (combinedProbability > 0.25) return 'moderate';
    return 'risky';
  },

  formatTicketAsText: () => {
    const { selections, calculateCombinedOdds, calculateRiskLevel } = get();
    if (selections.length === 0) return 'No selections';

    const combinedOdds = calculateCombinedOdds();
    const combinedProb = combinedOdds > 0 ? 1 / combinedOdds : 0;
    const riskLevel = calculateRiskLevel(combinedProb);

    const riskMeta = {
      ultra_safe: '🟢 Ultra Safe',
      safe: '🔵 Safe',
      moderate: '🟡 Moderate',
      risky: '🔴 Risky'
    };

    const legsText = selections
      .map((s, index) => `#${index + 1} ${s.matchName} — ${s.market} (${s.selection}) @ ${s.odds.toFixed(2)}`)
      .join('\n');

    return `🎯 BetAction Custom Ticket
---
${legsText}
---
Combined Odds: ${combinedOdds.toFixed(2)}
Risk Level: ${riskMeta[riskLevel]}

Built with BetAction 🎯`;
  },

  saveTicketToHistory: () => {
    const { selections, calculateCombinedOdds, calculateRiskLevel, clearAll } = get();
    if (selections.length === 0) return;

    const combinedOdds = calculateCombinedOdds();
    const combinedProb = combinedOdds > 0 ? 1 / combinedOdds : 0;
    const riskLevel = calculateRiskLevel(combinedProb);

    const tierEmoji = {
      ultra_safe: '🟢',
      safe: '🔵',
      moderate: '🟡',
      risky: '🔴'
    };

    const newTicket: Ticket = {
      id: `custom-${Date.now()}`,
      tier: riskLevel,
      name: 'Custom Ticket',
      emoji: tierEmoji[riskLevel],
      description: 'Custom parlay built from bet slip selections',
      legs: selections.map((s) => ({
        fixture_id: s.matchId,
        match: s.matchName,
        league: 'Today\'s Market',
        kickoff: new Date().toISOString(),
        market: s.market,
        selection: s.selection,
        probability: Number((1 / s.odds).toFixed(4)),
        odds: s.odds
      })),
      combined_odds: Number(combinedOdds.toFixed(2)),
      combined_probability: Number(combinedProb.toFixed(4)),
      potential_return_per_unit: Number(combinedOdds.toFixed(2)),
      confidence: combinedProb > 0.5 ? 'high' : combinedProb > 0.25 ? 'medium' : 'low',
      generated_at: new Date().toISOString(),
      type: 'custom'
    };

    useProfileStore.getState().saveTicket(newTicket);
    clearAll();
  },
}));
