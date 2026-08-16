import { useContext } from 'react';

import { ThemeContext } from '@/context/ThemeContext';

/**
 * 앱 테마 — 시스템 설정과 무관하게 메뉴에서 고른 값을 쓴다.
 * AppThemeProvider 밖에서는 'light'.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useContext(ThemeContext)?.theme ?? 'light';
}
