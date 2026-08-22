#!/usr/bin/env node
/**
 * Firebase 설정 파일 검증 — `npm run verify:firebase`
 * 콘솔에서 받은 google-services.json이 프로젝트 루트에 맞는지 확인한다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_PACKAGE = 'com.yun.unmyeonginjido';
const EXPECTED_PROJECT_ID = 'unmyeong-injido';
const EXPECTED_ANDROID_APP_ID =
  '1:563909743300:android:1e12d45496c4307c586f91';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, 'google-services.json');

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function ok(message) {
  console.log(`✓ ${message}`);
}

if (!existsSync(configPath)) {
  fail(
    'google-services.json 없음 — Firebase Console에서 다운로드 후 프로젝트 루트에 배치하세요.\n' +
      '  참고: google-services.json.example',
  );
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (error) {
  fail(`google-services.json 파싱 실패: ${error.message}`);
}

const clients = config?.client;
if (!Array.isArray(clients) || clients.length === 0) {
  fail('client 배열이 비어 있습니다.');
}

const packages = clients.map(
  (entry) => entry?.client_info?.android_client_info?.package_name,
);

if (!packages.includes(EXPECTED_PACKAGE)) {
  fail(
    `패키지명 불일치 — 기대: ${EXPECTED_PACKAGE}, 실제: ${packages.filter(Boolean).join(', ') || '(없음)'}`,
  );
}
ok(`Android 패키지: ${EXPECTED_PACKAGE}`);

const androidClient = clients.find(
  (entry) =>
    entry?.client_info?.android_client_info?.package_name === EXPECTED_PACKAGE,
);
const appId = androidClient?.client_info?.mobilesdk_app_id;
if (!appId) {
  fail('mobilesdk_app_id 없음');
}
if (appId !== EXPECTED_ANDROID_APP_ID) {
  fail(
    `Android 앱 ID 불일치 — 기대: ${EXPECTED_ANDROID_APP_ID}, 실제: ${appId}`,
  );
}
ok(`Android 앱 ID: ${appId}`);

const projectId = config?.project_info?.project_id;
if (!projectId) {
  fail('project_info.project_id 없음');
}
if (projectId !== EXPECTED_PROJECT_ID) {
  console.warn(
    `⚠ project_id가 예상(${EXPECTED_PROJECT_ID})과 다릅니다: ${projectId} — 콘솔에서 만든 이름이면 OK`,
  );
} else {
  ok(`프로젝트 ID: ${projectId}`);
}

const projectNumber = config?.project_info?.project_number;
if (projectNumber) {
  ok(`프로젝트 번호: ${projectNumber}`);
}

console.log('\nFirebase 설정 파일 준비 완료. (Analytics SDK 연동 시 개발 빌드·EAS 빌드 필요)');
