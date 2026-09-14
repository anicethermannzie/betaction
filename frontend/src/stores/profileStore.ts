import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket } from '@/types';

/**
 * Tickets the user has saved.
 *
 * Persisted to localStorage, which means it is per-device and survives logout
 * unless explicitly cleared — `reset()` is called on logout (see
 * stores/resetStores.ts) so one person's saved tickets are not shown to the next
 * person on a shared browser.
 *
 * The initial state used to be seeded with MOCK_SAVED_TICKETS, so every new
 * visitor found three fabricated tickets already "saved" in their account.
 */

interface ProfileState {
  savedTickets: Ticket[];
  saveTicket: (ticket: Ticket) => void;
  removeTicket: (ticketId: string) => void;
  clearHistory: () => void;
  reset: () => void;
}

export const PROFILE_STORAGE_KEY = 'betaction-profile-history';

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      savedTickets: [],
      saveTicket: (ticket) =>
        set((state) => ({
          savedTickets: [ticket, ...state.savedTickets],
        })),
      removeTicket: (ticketId) =>
        set((state) => ({
          savedTickets: state.savedTickets.filter((t) => t.id !== ticketId),
        })),
      clearHistory: () => set({ savedTickets: [] }),
      reset: () => set({ savedTickets: [] }),
    }),
    {
      name: PROFILE_STORAGE_KEY,
    }
  )
);
