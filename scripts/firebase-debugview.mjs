#!/usr/bin/env node
/**
 * Firebase Analytics DebugView on/off (Android, USB adb).
 * preview/development 빌드에서 GA4 본 리포트는 OFF — DebugView로만 확인.
 *
 *   npm run analytics:debug:on
 *   npm run analytics:debug:off
 */
import { spawnSync } from 'node:child_process';

import { resolveAdb } from './resolve-adb.mjs';

const PACKAGE = 'com.yun.unmyeonginjido';
const mode = process.argv[2];
const adb = resolveAdb();

if (mode !== 'on' && mode !== 'off') {
  console.error('Usage: node scripts/firebase-debugview.mjs <on|off>');
  process.exit(1);
}

const value = mode === 'on' ? PACKAGE : '.none.';
const result = spawnSync(
  adb,
  ['shell', 'setprop', 'debug.firebase.analytics.app', value],
  { encoding: 'utf8' },
);

if (result.error) {
  console.error('adb 실행 실패 — Android 기기 USB 연결·USB 디버깅을 확인하세요.');
  console.error(result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr ?? '');
  process.exit(result.status ?? 1);
}

if (mode === 'on') {
  console.log(`✓ DebugView ON — ${PACKAGE}`);
  console.log('  Firebase Console → 프로젝트 unmyeong-injido → Analytics → DebugView');
  console.log('  (socinal369@gmail.com 계정, 프로젝트 ID는 unmyeong-injido)');
  console.log('  확인 이벤트: tab_view, unlock_cta, today_card_open, notification_toggle');
  console.log('  앱 완전 종료 후 재실행 필요 (setprop은 프로세스 시작 시 적용)');
  console.log('  참고: 0.1.5 이하는 modular API 버그로 커스텀 이벤트 안 뜸 → 0.1.6+ 재빌드');
} else {
  console.log('✓ DebugView OFF');
}
