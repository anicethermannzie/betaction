'use client';

import { useEffect, useCallback } from 'react';
import { predictionApi } from '@/lib/api';
import { usePredictionStore } from '@/stores/predictionStore';
import type { Prediction } from '@/types';

export function usePrediction(fixtureId: number) {
  const store = usePredictionStore();

  const prediction = store.getPrediction(fixtureId);
  const loading    = store.isLoading(fixtureId);
  const error      = store.getError(fixtureId);

  const fetch = useCallback(async () => {
    if (store.getPrediction(fixtureId) || store.isLoading(fixtureId)) return;

    store.setLoading(fixtureId, true);
    store.clearError(fixtureId);

    try {
      const { data } = await predictionApi.getByFixture(fixtureId);
      store.setPrediction(fixtureId, data as Prediction);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load prediction';
      store.setError(fixtureId, message);
    } finally {
      store.setLoading(fixtureId, false);
    }
  }, [fixtureId, store]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { prediction, loading, error, refetch: fetch };
}
