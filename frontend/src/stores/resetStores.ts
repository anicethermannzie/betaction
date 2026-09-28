import { useBetSlipStore } from '@/stores/betSlipStore';
import { useMatchStore } from '@/stores/matchStore';
import { usePredictionStore } from '@/stores/predictionStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useTicketStore } from '@/stores/ticketStore';
import { logger } from '@/lib/logger';

/**
 * Wipe every piece of user state on logout.
 *
 * Only the auth store was being cleared, so the bet slip, saved tickets (which
 * are persisted to localStorage), cached predictions and match filters all
 * survived a sign-out. On a shared computer the next person saw the previous
 * user's selections.
 *
 * Add new stores here when you add them — this is the single place logout knows
 * about.
 */
export function resetUserState(): void {
  try {
    useBetSlipStore.getState().clearAll();
    useTicketStore.getState().reset();
    useProfileStore.getState().reset();
    usePredictionStore.getState().reset();
    useMatchStore.getState().reset();
    useSubscriptionStore.getState().reset();
  } catch (err) {
    // Logout must complete even if one store throws; leaving the user signed in
    // would be the worse failure.
    logger.error('Failed to clear local state on logout', err);
  }
}
