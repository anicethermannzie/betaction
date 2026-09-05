'use client';
import { create } from 'zustand';

export const FREE_FEATURES = { smart_picks_per_day: 3, smart_picks_show_reasoning: false, smart_picks_show_all_markets: false, smart_picks_confidence_score: false } as const;
export const VIP_FEATURES = { smart_picks_per_day: Infinity, smart_picks_show_reasoning: true, smart_picks_show_all_markets: true, smart_picks_confidence_score: true } as const;
interface SubscriptionState { plan: 'free' | 'vip'; setPlan: (plan: 'free' | 'vip') => void }
export const useSubscriptionStore = create<SubscriptionState>((set) => ({ plan: 'free', setPlan: (plan) => set({ plan }) }));
