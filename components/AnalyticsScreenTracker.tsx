import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { logScreenView } from '@/lib/firebase/analytics';
import { normalizeAnalyticsScreen } from '@/lib/firebase/screens';

/** 스택·모달 화면 진입 시 `screen_view` (탭은 `tab_view`) */
export function AnalyticsScreenTracker() {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const screen = normalizeAnalyticsScreen(pathname);
    if (!screen || screen === prev.current) return;
    prev.current = screen;
    void logScreenView(screen);
  }, [pathname]);

  return null;
}
