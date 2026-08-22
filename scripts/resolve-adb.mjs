#!/usr/bin/env node
/**
 * adb 경로 — PATH → ANDROID_HOME → macOS 기본 → 외장 AndroidSDK
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export function resolveAdb() {
  const candidates = [
    process.env.ADB,
    join(process.env.ANDROID_HOME ?? '', 'platform-tools', 'adb'),
    join(process.env.ANDROID_SDK_ROOT ?? '', 'platform-tools', 'adb'),
    join(homedir(), 'Library', 'Android', 'sdk', 'platform-tools', 'adb'),
    '/Volumes/Netac 2TB/Dev/AndroidSDK/platform-tools/adb',
  ].filter(Boolean);

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return 'adb';
}
