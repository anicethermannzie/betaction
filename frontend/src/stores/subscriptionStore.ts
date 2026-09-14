import { create } from 'zustand';
import { billingApi } from '@/lib/api';
import { logger, userMessage } from '@/lib/logger';
import type { BillingStatus, SubscriptionDetail } from '@/types';

/**
 * Billing/plan state for the current user.
 *
 * This is a READ model and a set of redirect triggers — it never decides
 * entitlement itself. `plan` here is for display only (labeling the UI,
 * showing/hiding an "Upgrade" button); the actual gate is server-side in
 * prediction-service, which verifies the JWT/database independently of
 * anything this store or the frontend claims. See
 * backend/prediction-service/src/middleware/auth.py.
 *
 * fetchStatus() re-reads GET /billing/status, which hits the database
 * directly (not the JWT claim), so it reflects a just-completed checkout
 * immediately — before the access token itself has been refreshed. The
 * success page additionally triggers a token refresh once this confirms
 * 'vip', so prediction-service's enforcement (which does read the JWT
 * claim) does not lag behind the UI by up to 15 minutes.
 */

interface SubscriptionState {
  plan: 'free' | 'vip';
  trialEndsAt: string | null;
  subscription: SubscriptionDetail | null;
  isLoading: boolean;
  /** True once fetchStatus has resolved at least once — lets the UI tell
   * "still loading" apart from "loaded, and this user is free". */
  loaded: boolean;
  error: string | null;
  /** True while a Checkout/Portal redirect is in flight. */
  isRedirecting: boolean;

  fetchStatus: () => Promise<BillingStatus | null>;
  /** Starts Stripe Checkout and navigates the browser there. Resolves only
   * on failure (a success navigates away from the page entirely). */
  startCheckout: () => Promise<void>;
  /** Starts a Stripe Billing Portal session and navigates the browser there. */
  openPortal: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  plan: 'free' as const,
  trialEndsAt: null as string | null,
  subscription: null as SubscriptionDetail | null,
  isLoading: false,
  loaded: false,
  error: null as string | null,
  isRedirecting: false,
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  ...INITIAL_STATE,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await billingApi.status();
      set({ plan: data.plan, trialEndsAt: data.trialEndsAt, subscription: data.subscription, loaded: true });
      return data;
    } catch (err) {
      logger.error('Failed to load billing status', err);
      set({ error: userMessage(err, "Couldn't load your subscription status.") });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  startCheckout: async () => {
    set({ isRedirecting: true, error: null });
    try {
      const { data } = await billingApi.createCheckoutSession();
      window.location.href = data.url;
      // No `finally` reset of isRedirecting: the page is navigating away, and
      // resetting it here would just flicker the button back before the
      // browser leaves.
    } catch (err) {
      logger.error('Failed to start checkout', err);
      set({
        isRedirecting: false,
        error: userMessage(err, "Couldn't start checkout. Please try again."),
      });
    }
  },

  openPortal: async () => {
    set({ isRedirecting: true, error: null });
    try {
      const { data } = await billingApi.createPortalSession();
      window.location.href = data.url;
    } catch (err) {
      logger.error('Failed to open billing portal', err);
      set({
        isRedirecting: false,
        error: userMessage(err, "Couldn't open subscription management. Please try again."),
      });
    }
  },

  clearError: () => set({ error: null }),

  /** Called on logout — see stores/resetStores.ts. */
  reset: () => set({ ...INITIAL_STATE }),
}));
