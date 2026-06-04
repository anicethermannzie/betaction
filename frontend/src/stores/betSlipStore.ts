import { create } from 'zustand';

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
}));
