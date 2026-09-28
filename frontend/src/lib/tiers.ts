import type { Ticket, TicketTierKey } from '@/types';

/**
 * Display labels for the four confidence tiers. The enum values themselves
 * (ultra_safe, safe, moderate, risky) are the wire/storage contract with
 * prediction-service and localStorage, so they never change — only this map
 * decides what a user reads. The `name` prediction-service sends with each
 * ticket is deliberately ignored for the same reason.
 */
export const TIER_LABELS: Record<TicketTierKey, string> = {
  ultra_safe: 'Steady',
  safe:       'Balanced',
  moderate:   'Bold',
  risky:      'Long Shot',
};

export function ticketLabel(ticket: Pick<Ticket, 'tier' | 'name' | 'type'>): string {
  if (ticket.type === 'custom') return 'Custom Combo';
  return TIER_LABELS[ticket.tier] ?? ticket.name;
}
