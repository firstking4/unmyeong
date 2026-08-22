#!/usr/bin/env node
/**
 * Firebase `google-services.json` 설치 — 콘솔 다운로드 파일을 프로젝트 루트로 복사 후 검증.
 *
 * Usage:
 *   npm run firebase:install -- ~/Downloads/google-services.json
 *   npm run firebase:install   # Downloads/google-services.json 시도
 */
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'google-services.json');
const verifyScript = join(root, 'scripts', 'verify-firebase-config.mjs');

/** Chrome 등이 `google-services (1).json`처럼 저장할 때 Downloads에서 최신 파일 찾기 */
function findLatestGoogleServicesJson(dir) {
  if (!dir || !existsSync(dir)) return null;
  const matches = readdirSync(dir)
    .filter((name) => /^google-services( \(\d+\))?\.json$/i.test(name))
    .map((name) => join(dir, name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return matches[0] ?? null;
}

const home = process.env.HOME ?? '';
const downloadDirs = [join(home, 'Downloads'), join(home, 'Desktop')];

const candidates = [
  process.argv[2],
  ...downloadDirs.map((dir) => join(dir, 'google-services.json')),
  ...downloadDirs.map(findLatestGoogleServicesJson),
].filter(Boolean);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const source = candidates.find((path) => path && existsSync(path));
if (!source) {
  fail(
    '소스 파일 없음 — Firebase Console에서 다운로드한 경로를 인자로 주세요.\n' +
      '  예: npm run firebase:install -- ~/Downloads/google-services.json',
  );
}

copyFileSync(source, dest);
console.log(`✓ 복사: ${source} → google-services.json`);

const result = spawnSync(process.execPath, [verifyScript], {
  cwd: root,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
