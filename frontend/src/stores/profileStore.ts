import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ticket } from '@/types';
import { MOCK_SAVED_TICKETS } from '@/lib/mockData';

interface ProfileState {
  savedTickets: Ticket[];
  saveTicket: (ticket: Ticket) => void;
  removeTicket: (ticketId: string) => void;
  clearHistory: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      savedTickets: MOCK_SAVED_TICKETS,
      saveTicket: (ticket) =>
        set((state) => ({
          savedTickets: [ticket, ...state.savedTickets],
        })),
      removeTicket: (ticketId) =>
        set((state) => ({
          savedTickets: state.savedTickets.filter((t) => t.id !== ticketId),
        })),
      clearHistory: () => set({ savedTickets: [] }),
    }),
    {
      name: 'betaction-profile-history',
    }
  )
);
