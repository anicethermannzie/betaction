import { create } from 'zustand';
import type { Prediction } from '@/types';

interface PredictionState {
  predictions: Record<number, Prediction>;
  loading:     Record<number, boolean>;
  errors:      Record<number, string>;

  setPrediction:    (fixtureId: number, prediction: Prediction) => void;
  setLoading:       (fixtureId: number, loading: boolean) => void;
  setError:         (fixtureId: number, error: string) => void;
  clearError:       (fixtureId: number) => void;
  getPrediction:    (fixtureId: number) => Prediction | undefined;
  isLoading:        (fixtureId: number) => boolean;
  getError:         (fixtureId: number) => string | undefined;
}

export const usePredictionStore = create<PredictionState>((set, get) => ({
  predictions: {},
  loading:     {},
  errors:      {},

  setPrediction: (fixtureId, prediction) =>
    set((state) => ({
      predictions: { ...state.predictions, [fixtureId]: prediction },
    })),

  setLoading: (fixtureId, loading) =>
    set((state) => ({
      loading: { ...state.loading, [fixtureId]: loading },
    })),

  setError: (fixtureId, error) =>
    set((state) => ({
      errors: { ...state.errors, [fixtureId]: error },
    })),

  clearError: (fixtureId) =>
    set((state) => {
      const errors = { ...state.errors };
      delete errors[fixtureId];
      return { errors };
    }),

  getPrediction: (fixtureId) => get().predictions[fixtureId],
  isLoading:     (fixtureId) => get().loading[fixtureId] ?? false,
  getError:      (fixtureId) => get().errors[fixtureId],
}));
