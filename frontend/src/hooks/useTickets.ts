'use client';

import { useCallback, useEffect } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { useProfileStore } from '@/stores/profileStore';
import type { Ticket, TicketTierKey } from '@/types';

export function useTickets() {
  const store = useTicketStore();
  const { savedTickets, saveTicket, removeTicket } = useProfileStore();

  // Auto-fetch on first mount if tickets aren't loaded yet
  useEffect(() => {
    if (store.tickets.length === 0 && !store.isLoading) {
      store.fetchTodayTickets();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleTickets = store.selectedTier === 'all'
    ? store.tickets
    : store.tickets.filter((t) => t.tier === store.selectedTier);

  const isSaved = useCallback(
    (ticketId: string) => savedTickets.some((t) => t.id === ticketId),
    [savedTickets]
  );

  const toggleSave = useCallback(
    (ticketId: string) => {
      const existing = savedTickets.find((t) => t.id === ticketId);
      if (existing) {
        removeTicket(ticketId);
      } else {
        const ticket = store.tickets.find((t) => t.id === ticketId);
        if (ticket) {
          saveTicket({
            ...ticket,
            type: 'ai_generated',
          });
        }
      }
    },
    [savedTickets, store.tickets, saveTicket, removeTicket]
  );

  const ticketsByTier = useCallback(
    (tier: TicketTierKey) => store.tickets.filter((t) => t.tier === tier),
    [store.tickets]
  );

  return {
    tickets:        store.tickets,
    visibleTickets,
    selectedTier:   store.selectedTier,
    isLoading:      store.isLoading,
    error:          store.error,
    savedTicketIds: savedTickets.map((t) => t.id),

    fetchTodayTickets:      store.fetchTodayTickets,
    filterByTier:           store.filterByTier,
    isSaved,
    toggleSave,
    ticketsByTier,
    copyTicketToClipboard:  store.copyTicketToClipboard,
  };
}
