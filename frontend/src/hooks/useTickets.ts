'use client';

import { useCallback, useEffect } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import type { Ticket, TicketTierKey } from '@/types';

export function useTickets() {
  const store = useTicketStore();

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
    (ticketId: string) => store.savedTicketIds.includes(ticketId),
    [store.savedTicketIds]
  );

  const toggleSave = useCallback(
    (ticketId: string) => {
      if (store.savedTicketIds.includes(ticketId)) {
        store.unsaveTicket(ticketId);
      } else {
        store.saveTicket(ticketId);
      }
    },
    [store]
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
    savedTicketIds: store.savedTicketIds,

    fetchTodayTickets:      store.fetchTodayTickets,
    filterByTier:           store.filterByTier,
    isSaved,
    toggleSave,
    ticketsByTier,
    copyTicketToClipboard:  store.copyTicketToClipboard,
  };
}
