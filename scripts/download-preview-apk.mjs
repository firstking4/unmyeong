#!/usr/bin/env node
/**
 * preview APK 다운로드 — `npm run store:download-apk [buildId] [version]`
 * 기본: EAS 빌드 806367ea (0.1.4 preview) → 외장 releases/
 */
import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const DEFAULT_BUILD_ID = 'aa2f058d-11c8-4487-9f88-5e636088e1b3';
const DEFAULT_VERSION = '0.1.4-preview';
const EXTERNAL_RELEASES =
  '/Volumes/Netac 2TB/Dev/Expo/unmyeong-injido/releases';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildId = process.argv[2] || DEFAULT_BUILD_ID;
const version = process.argv[3] || DEFAULT_VERSION;

function resolveOutputDir() {
  if (existsSync('/Volumes/Netac 2TB/Dev/Expo')) {
    return EXTERNAL_RELEASES;
  }
  return join(root, 'releases');
}

function parseEasJson(stdout) {
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('EAS JSON 출력을 찾을 수 없습니다.');
  }
  return JSON.parse(stdout.slice(start, end + 1));
}

function getBuild(id) {
  const json = execFileSync(
    'npx',
    ['eas', 'build:view', id, '--json'],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return parseEasJson(json);
}

async function download(url, dest) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`다운로드 실패: HTTP ${response.status}`);
  }
  await pipeline(response.body, createWriteStream(dest));
}

const build = getBuild(buildId);
if (build.status !== 'FINISHED') {
  console.error(`빌드 ${buildId} 상태: ${build.status} — FINISHED 후 다시 실행하세요.`);
  process.exit(1);
}

const artifactUrl =
  build?.artifacts?.buildUrl || build?.artifacts?.applicationArchiveUrl;
if (!artifactUrl) {
  throw new Error(`빌드 ${buildId}에서 APK URL을 찾을 수 없습니다.`);
}

const outDir = resolveOutputDir();
mkdirSync(outDir, { recursive: true });
const dest = join(outDir, `unmyeong-injido-${version}.apk`);

console.log(`빌드 ID: ${buildId}`);
console.log(`다운로드 중 → ${dest}`);
await download(artifactUrl, dest);
console.log(`완료: ${dest}`);
