import { useContext } from 'react';

import { ThemeContext } from '@/context/ThemeContext';

/** Web — 앱 테마 컨텍스트 동일. */
export function useColorScheme(): 'light' | 'dark' {
  return useContext(ThemeContext)?.theme ?? 'light';
}
