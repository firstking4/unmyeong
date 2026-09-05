import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { localYmd } from '@/lib/daily/pick';

import {
  emptyRewardUnlockState,
  grantRewardUnlock,
  isRewardUnlocked,
  loadRewardUnlockState,
  saveRewardUnlockState,
  clearRewardUnlockState,
  type RewardScreenId,
  type RewardUnlockState,
} from '@/lib/rewardUnlock';
import { clearUnlockFortuneOutcomeState } from '@/lib/unlockFortuneOutcome';
import { logTodayCardOpen, logUnlockCta } from '@/lib/firebase/analytics';
import type { TodayCardKind } from '@/lib/firebase/config';

type RewardUnlockContextValue = {
  loaded: boolean;
  isUnlocked: (screen: RewardScreenId, scopeId?: string) => boolean;
  /** 실제 보상형 광고의 reward earned 콜백(또는 스탠드인 CTA)에서만 호출한다. */
  grantUnlock: (screen: RewardScreenId, scopeId?: string) => Promise<void>;
  /** 오늘 상세 해금·광고운만 지운다. 프로필·지인은 유지. */
  resetTodayUnlocks: () => Promise<void>;
};

const TODAY_CARD_BY_SCREEN: Partial<Record<RewardScreenId, TodayCardKind>> = {
  saju_today: 'saju',
  seonghyang_today: 'seonghyang',
  tarot_today: 'tarot',
  contact_today: 'contact',
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

  useEffect(() => {
    const rollover = () => {
      const today = localYmd(new Date());
      setState((current) => (current.date === today ? current : { date: today, screens: {} }));
    };
    rollover();
    const onChange = (status: AppStateStatus) => {
      if (status === 'active') rollover();
    };
    const sub = AppState.addEventListener('change', onChange);
    const poll = setInterval(rollover, 60_000);
    return () => {
      sub.remove();
      clearInterval(poll);
    };
  }, []);

  const grantUnlock = useCallback(async (screen: RewardScreenId, scopeId?: string) => {
    void logUnlockCta(screen);
    const card = TODAY_CARD_BY_SCREEN[screen];
    if (card) void logTodayCardOpen(card);
    setState((current) => {
      const next = grantRewardUnlock(current, screen, scopeId);
      void saveRewardUnlockState(next);
      return next;
    });
  }, []);

  const resetTodayUnlocks = useCallback(async () => {
    await clearRewardUnlockState();
    await clearUnlockFortuneOutcomeState();
    setState(emptyRewardUnlockState());
  }, []);

  const value = useMemo(
    () => ({
      loaded,
      isUnlocked: (screen: RewardScreenId, scopeId?: string) =>
        isRewardUnlocked(state, screen, scopeId),
      grantUnlock,
      resetTodayUnlocks,
    }),
    [grantUnlock, loaded, resetTodayUnlocks, state],
  );

  return <RewardUnlockContext.Provider value={value}>{children}</RewardUnlockContext.Provider>;
}

export function useRewardUnlock() {
  const context = useContext(RewardUnlockContext);
  if (!context) throw new Error('useRewardUnlock must be used within RewardUnlockProvider');
  return context;
}
