import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { localYmd } from '@/lib/daily/pick';

type LocalDateContextValue = {
  dateKey: string;
  refresh: () => void;
};

const LocalDateContext = createContext<LocalDateContextValue | null>(null);

export function LocalDateProvider({ children }: { children: ReactNode }) {
  const [dateKey, setDateKey] = useState(() => localYmd(new Date()));

  const refresh = useCallback(() => {
    const next = localYmd(new Date());
    setDateKey((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 30_000);
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') refresh();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      clearInterval(poll);
      sub.remove();
    };
  }, [refresh]);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 50);
    return () => clearTimeout(timer);
  }, [dateKey, refresh]);

  return (
    <LocalDateContext.Provider value={{ dateKey, refresh }}>{children}</LocalDateContext.Provider>
  );
}

/** 로컬 날짜(YYYY-MM-DD). 전역 폴링·자정·앱 복귀 + 화면 포커스 때 갱신된다. */
export function useLocalDateKey(): string {
  const ctx = useContext(LocalDateContext);
  if (!ctx) throw new Error('useLocalDateKey must be used within LocalDateProvider');

  useFocusEffect(
    useCallback(() => {
      ctx.refresh();
    }, [ctx.refresh]),
  );

  return ctx.dateKey;
}
