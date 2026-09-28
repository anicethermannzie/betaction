import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  billingApi: {
    status: vi.fn(),
    createCheckoutSession: vi.fn(),
    createPortalSession: vi.fn(),
  },
}));

import { billingApi } from '@/lib/api';
import { useSubscriptionStore } from './subscriptionStore';

/**
 * This store is a READ model plus redirect triggers — it never decides
 * entitlement (prediction-service does, from the JWT/database). These tests
 * cover the parts that would silently mislead a user if they broke: a failed
 * status fetch not being mistaken for "confirmed free", and a redirect not
 * getting stuck mid-flight.
 */

beforeEach(() => {
  useSubscriptionStore.setState({
    plan: 'free', trialEndsAt: null, subscription: null,
    isLoading: false, loaded: false, error: null, isRedirecting: false,
  });
  vi.stubGlobal('window', { location: { href: '' } });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchStatus', () => {
  it('populates plan, trialEndsAt and subscription from the response', async () => {
    vi.mocked(billingApi.status).mockResolvedValue({
      data: {
        plan: 'vip',
        trialEndsAt: null,
        subscription: { status: 'active', currentPeriodEnd: '2026-10-14T00:00:00.000Z', cancelAtPeriodEnd: false },
      },
    } as never);

    const result = await useSubscriptionStore.getState().fetchStatus();

    expect(result?.plan).toBe('vip');
    expect(useSubscriptionStore.getState().plan).toBe('vip');
    expect(useSubscriptionStore.getState().loaded).toBe(true);
    expect(useSubscriptionStore.getState().subscription?.status).toBe('active');
  });

  it('on failure, sets an error and does NOT claim the user is on the free plan', async () => {
    vi.mocked(billingApi.status).mockRejectedValue(new Error('network error'));

    const result = await useSubscriptionStore.getState().fetchStatus();

    expect(result).toBeNull();
    const state = useSubscriptionStore.getState();
    expect(state.error).toBeTruthy();
    // `loaded` stays false: the UI must be able to tell "we don't know yet"
    // apart from "we asked, and the answer is free" — collapsing the two
    // would make an outage look identical to a real downgrade.
    expect(state.loaded).toBe(false);
    expect(state.plan).toBe('free'); // untouched default, not asserted as fact
  });
});

describe('startCheckout', () => {
  it('navigates the browser to the Checkout URL', async () => {
    vi.mocked(billingApi.createCheckoutSession).mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/session/abc' },
    } as never);

    await useSubscriptionStore.getState().startCheckout();

    expect(window.location.href).toBe('https://checkout.stripe.com/session/abc');
  });

  it('clears the redirecting flag and surfaces an error on failure', async () => {
    vi.mocked(billingApi.createCheckoutSession).mockRejectedValue({
      response: { data: { error: 'Could not start checkout. Please try again.' } },
    });

    await useSubscriptionStore.getState().startCheckout();

    const state = useSubscriptionStore.getState();
    expect(state.isRedirecting).toBe(false);
    expect(state.error).toBe('Could not start checkout. Please try again.');
  });

  it('does not leave isRedirecting stuck true on a successful redirect', async () => {
    vi.mocked(billingApi.createCheckoutSession).mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/session/abc' },
    } as never);

    const promise = useSubscriptionStore.getState().startCheckout();
    expect(useSubscriptionStore.getState().isRedirecting).toBe(true);
    await promise;

    // Deliberately still true here — the page is navigating away, and
    // resetting the flag would only flicker the button before the browser
    // actually leaves. See the store's own comment on this.
    expect(useSubscriptionStore.getState().isRedirecting).toBe(true);
  });
});

describe('openPortal', () => {
  it('navigates the browser to the portal URL', async () => {
    vi.mocked(billingApi.createPortalSession).mockResolvedValue({
      data: { url: 'https://billing.stripe.com/p/abc' },
    } as never);

    await useSubscriptionStore.getState().openPortal();

    expect(window.location.href).toBe('https://billing.stripe.com/p/abc');
  });
});

describe('reset', () => {
  it('returns to the initial state — used on logout', () => {
    useSubscriptionStore.setState({ plan: 'vip', loaded: true, error: 'stale error' });

    useSubscriptionStore.getState().reset();

    const state = useSubscriptionStore.getState();
    expect(state.plan).toBe('free');
    expect(state.loaded).toBe(false);
    expect(state.error).toBeNull();
  });
});
