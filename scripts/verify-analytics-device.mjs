#!/usr/bin/env node
/**
 * 실기기 Analytics 수집 상태 점검 — `npm run analytics:verify-device`
 * logcat에서 "app measurement is disabled" 여부를 확인한다.
 */
import { spawnSync } from 'node:child_process';

import { resolveAdb } from './resolve-adb.mjs';

const PACKAGE = 'com.yun.unmyeonginjido';
const adb = resolveAdb();

function run(args) {
  return spawnSync(adb, args, { encoding: 'utf8' });
}

const devices = run(['devices']);
if (!devices.stdout?.includes('device\n') && !devices.stdout?.match(/\tdevice$/m)) {
  console.error('✗ USB 기기 없음 — adb devices 확인');
  process.exit(1);
}

const debugProp = run(['shell', 'getprop', 'debug.firebase.analytics.app']).stdout?.trim();
console.log(`debug.firebase.analytics.app = ${debugProp || '(없음)'}`);
if (debugProp !== PACKAGE) {
  console.warn('⚠ DebugView 미설정 — npm run analytics:debug:on 후 앱 재시작');
}

run(['shell', 'am', 'force-stop', PACKAGE]);
run(['logcat', '-c']);
run(['shell', 'monkey', '-p', PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1']);
spawnSync('sleep', ['4']);
// 하단 탭 3회 탭 → tab_view 발화 유도
for (const x of [270, 540, 810]) {
  run(['shell', 'input', 'tap', String(x), '2200']);
  spawnSync('sleep', ['1.5']);
}
spawnSync('sleep', ['2']);

const log = run(['logcat', '-d', '-s', 'FA', 'FA-SVC']);
const text = `${log.stdout ?? ''}${log.stderr ?? ''}`;

if (text.includes('App measurement disabled via the manifest')) {
  console.error('✗ Analytics SDK 수집 OFF — 이벤트가 전송되지 않음 (DebugView도 안 뜸)');
  console.error('  원인: manifest firebase_analytics_collection_enabled=false 또는 구버전(0.1.4 preview) 빌드');
  console.error('  조치: firebase.json 수정 후 preview APK 재빌드·재설치 (0.1.5+)');
  process.exit(1);
}

if (text.includes('Event not sent since app measurement is disabled')) {
  console.error('✗ 이벤트 전송 차단됨 — SDK 수집이 꺼져 있음');
  process.exit(1);
}

if (text.includes('tab_view')) {
  console.log('✓ 커스텀 이벤트(tab_view) 전송 확인');
} else if (text.includes('unlock_cta') || text.includes('today_card_open')) {
  console.log('✓ 클릭 이벤트(unlock_cta/today_card_open) 전송 확인');
} else if (text.includes('Logging event') && text.includes('origin=app')) {
  console.log('✓ 커스텀 이벤트(origin=app) 전송 확인');
} else if (text.includes('Logging event')) {
  console.warn('△ 자동 screen_view만 보임 — 커스텀/클릭 이벤트 미전송');
  console.warn('  원인: @react-native-firebase/analytics v26 modular API 미적용(0.1.5 이하)');
  console.warn('  조치: 0.1.6+ preview APK 재설치 후 탭·「내용 보기」 테스트');
  process.exit(1);
} else {
  console.log('△ manifest 수집은 ON — 탭 이동 후 tab_view는 DebugView에서 확인');
}

console.log('✓ 기기 Analytics 기본 점검 통과');
