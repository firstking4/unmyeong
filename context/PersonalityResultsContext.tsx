import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { BigFiveResult, FourAxisResult } from '@/lib/personalityTest';
import { appStorage } from '@/lib/storage';

const STORAGE_KEY = '@unmyeong/personality-results';

export type PersonalityResults = {
  fourAxis?: FourAxisResult;
  bigFive?: BigFiveResult;
};

type PersonalityResultsContextValue = {
  results: PersonalityResults;
  loaded: boolean;
  setFourAxis: (result: FourAxisResult) => Promise<void>;
  setBigFive: (result: BigFiveResult) => Promise<void>;
  clearResults: () => Promise<void>;
};

const PersonalityResultsContext = createContext<PersonalityResultsContextValue | null>(null);

function sanitize(raw: unknown): PersonalityResults {
  if (!raw || typeof raw !== 'object') return {};
  const data = raw as PersonalityResults;
  return {
    fourAxis: data.fourAxis,
    bigFive: data.bigFive,
  };
}

export function PersonalityResultsProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<PersonalityResults>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await appStorage.getItem(STORAGE_KEY);
        if (alive && raw) setResults(sanitize(JSON.parse(raw)));
      } catch {
        // ignore corrupt / unavailable storage
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setFourAxis = useCallback(async (result: FourAxisResult) => {
    let next: PersonalityResults = {};
    setResults((prev) => {
      next = { ...prev, fourAxis: result };
      return next;
    });
    await appStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setBigFive = useCallback(async (result: BigFiveResult) => {
    let next: PersonalityResults = {};
    setResults((prev) => {
      next = { ...prev, bigFive: result };
      return next;
    });
    await appStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearResults = useCallback(async () => {
    setResults({});
    await appStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      results,
      loaded,
      setFourAxis,
      setBigFive,
      clearResults,
    }),
    [results, loaded, setFourAxis, setBigFive, clearResults],
  );

  return (
    <PersonalityResultsContext.Provider value={value}>{children}</PersonalityResultsContext.Provider>
  );
}

export function usePersonalityResults() {
  const ctx = useContext(PersonalityResultsContext);
  if (!ctx) throw new Error('usePersonalityResults must be used within PersonalityResultsProvider');
  return ctx;
}
