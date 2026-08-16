import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, useColorScheme as useSystemColorScheme } from 'react-native';

import { appStorage } from '@/lib/storage';

const STORAGE_KEY = '@unmyeong/theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type AppTheme = 'light' | 'dark';

type ThemeContextValue = {
  /** 메뉴에서 고른 값 (라이트 / 다크 / 시스템) */
  preference: ThemePreference;
  /** Colors·UI에 쓰는 실제 스킴 */
  theme: AppTheme;
  loaded: boolean;
  setTheme: (preference: ThemePreference) => Promise<void>;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function parsePreference(raw: string | null): ThemePreference {
  if (raw === 'dark' || raw === 'system') return raw;
  return 'light';
}

function resolveTheme(
  preference: ThemePreference,
  system: string | null | undefined,
): AppTheme {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

function applyNativeScheme(preference: ThemePreference) {
  try {
    // 'unspecified' = 시스템 설정을 그대로 따른다
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  } catch {
    // older runtimes may not support setColorScheme
  }
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await appStorage.getItem(STORAGE_KEY);
        if (!alive) return;
        const next = parsePreference(raw);
        setPreferenceState(next);
        applyNativeScheme(next);
      } catch {
        if (alive) applyNativeScheme('light');
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setTheme = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    applyNativeScheme(next);
    await appStorage.setItem(STORAGE_KEY, next);
  }, []);

  const theme = resolveTheme(preference, systemScheme);

  const value = useMemo(
    () => ({
      preference,
      theme,
      loaded,
      setTheme,
    }),
    [preference, theme, loaded, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within AppThemeProvider');
  return ctx;
}
