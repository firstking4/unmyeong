/** 하단 탭 — `tab_view`로 별도 기록 */
const TAB_ROUTES = new Set(['/', '/seonghyang', '/saju', '/tarot', '/gunghap']);

/**
 * expo-router pathname → GA4 `screen_view` 이름.
 * 지인 ID 등 개인 식별자는 넣지 않는다.
 */
export function normalizeAnalyticsScreen(pathname: string): string | null {
  if (TAB_ROUTES.has(pathname)) return null;
  if (pathname === '/contact/new') return 'contact_new';
  if (/^\/contact\/[^/]+\/edit$/.test(pathname)) return 'contact_edit';
  if (/^\/contact\/[^/]+$/.test(pathname)) return 'contact_detail';

  const stripped = pathname.replace(/^\//, '').replace(/\//g, '_');
  return stripped || null;
}
