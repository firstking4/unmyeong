#!/usr/bin/env node
/**
 * preview APK 실기기 설치 — `npm run analytics:install-preview [apkPath]`
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveAdb } from './resolve-adb.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXTERNAL_APK =
  '/Volumes/Netac 2TB/Dev/Expo/unmyeong-injido/releases/unmyeong-injido-0.1.5-preview.apk';
const LOCAL_APK = join(root, 'releases', 'unmyeong-injido-0.1.5-preview.apk');

const apk =
  process.argv[2] ||
  (existsSync(EXTERNAL_APK) ? EXTERNAL_APK : LOCAL_APK);

if (!existsSync(apk)) {
  console.error('APK 없음 — 먼저 npm run store:download-apk');
  process.exit(1);
}

const adb = resolveAdb();
const result = spawnSync(adb, ['install', '-r', apk], { encoding: 'utf8' });

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  console.error('adb 실행 실패 — USB 연결·platform-tools 설치를 확인하세요.');
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
