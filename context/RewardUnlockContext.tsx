import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  emptyRewardUnlockState,
  grantRewardUnlock,
  isRewardUnlocked,
  loadRewardUnlockState,
  saveRewardUnlockState,
  type RewardScreenId,
  type RewardUnlockState,
} from '@/lib/rewardUnlock';

type RewardUnlockContextValue = {
  loaded: boolean;
  isUnlocked: (screen: RewardScreenId) => boolean;
  /** 실제 보상형 광고의 reward earned 콜백에서만 호출한다. */
  grantUnlock: (screen: RewardScreenId) => Promise<void>;
};

const RewardUnlockContext = createContext<RewardUnlockContextValue | null>(null);

export function RewardUnlockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RewardUnlockState>(emptyRewardUnlockState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void loadRewardUnlockState()
      .then((next) => {
        if (active) setState(next);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const grantUnlock = useCallback(async (screen: RewardScreenId) => {
    setState((current) => {
      const next = grantRewardUnlock(current, screen);
      void saveRewardUnlockState(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      loaded,
      isUnlocked: (screen: RewardScreenId) => isRewardUnlocked(state, screen),
      grantUnlock,
    }),
    [grantUnlock, loaded, state],
  );

  return <RewardUnlockContext.Provider value={value}>{children}</RewardUnlockContext.Provider>;
}

export function useRewardUnlock() {
  const context = useContext(RewardUnlockContext);
  if (!context) throw new Error('useRewardUnlock must be used within RewardUnlockProvider');
  return context;
}
