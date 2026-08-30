#!/usr/bin/env node
/**
 * Play 개발자 등록·출시 준비 — 로컬에서 확인 가능한 항목 점검.
 * Play Console 본인 확인·계좌 입금 등은 콘솔에서만 확인 가능 (API 미사용).
 *
 * Usage: npm run store:verify-developer
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_PACKAGE = 'com.yun.unmyeonginjido';
const DEVELOPER_NAME = 'Yun In Lab';
const SUPPORT_EMAIL = 'firstking4@gmail.com';
const PRIVACY_URL =
  'https://firstking4.github.io/unmyeong/legal/privacy.html';
const AAB_RELEASES_DIR =
  '/Volumes/Netac 2TB/Dev/Expo/unmyeong-injido/releases';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
let warnings = 0;

function fail(message) {
  console.error(`✗ ${message}`);
  failures += 1;
}

function warn(message) {
  console.warn(`⚠ ${message}`);
  warnings += 1;
}

function ok(message) {
  console.log(`✓ ${message}`);
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

section('앱 식별자 (로컬)');
const appJsonPath = join(root, 'app.json');
if (!existsSync(appJsonPath)) {
  fail('app.json 없음');
} else {
  const appJson = readJson(appJsonPath);
  const pkg = appJson?.expo?.android?.package;
  const version = appJson?.expo?.version;
  const versionCode = appJson?.expo?.android?.versionCode;
  if (pkg !== EXPECTED_PACKAGE) {
    fail(`app.json 패키지 불일치 — 기대 ${EXPECTED_PACKAGE}, 실제 ${pkg ?? '(없음)'}`);
  } else {
    ok(`app.json 패키지: ${pkg}`);
  }
  if (version) ok(`앱 버전: ${version} (versionCode ${versionCode ?? '?'})`);
}

const manifestPath = join(root, 'android/app/src/main/AndroidManifest.xml');
if (existsSync(manifestPath)) {
  const manifest = readFileSync(manifestPath, 'utf8');
  if (manifest.includes(`package="${EXPECTED_PACKAGE}"`) || manifest.includes(EXPECTED_PACKAGE)) {
    ok(`AndroidManifest 패키지 참조: ${EXPECTED_PACKAGE}`);
  } else {
    warn('AndroidManifest에서 패키지명을 찾지 못함 — prebuild 상태 확인');
  }
} else {
  warn('android/ 네이티브 폴더 없음 — EAS 빌드만 사용 중이면 OK');
}

const gradlePath = join(root, 'android/app/build.gradle');
if (existsSync(gradlePath)) {
  const gradle = readFileSync(gradlePath, 'utf8');
  const match = gradle.match(/applicationId\s+['"]([^'"]+)['"]/);
  if (match?.[1] === EXPECTED_PACKAGE) {
    ok(`Gradle applicationId: ${match[1]}`);
  } else if (match) {
    fail(`Gradle applicationId 불일치 — ${match[1]}`);
  }
}

section('Firebase / google-services.json');
const gsPaths = [
  join(root, 'google-services.json'),
  join(root, 'android/app/google-services.json'),
];
const gsPath = gsPaths.find((p) => existsSync(p));
if (!gsPath) {
  warn('google-services.json 없음 — Play 출시 필수는 아니나 Firebase 연동 시 필요');
} else {
  try {
    const gs = readJson(gsPath);
    const packages = (gs.client ?? []).map(
      (c) => c?.client_info?.android_client_info?.package_name,
    );
    if (packages.includes(EXPECTED_PACKAGE)) {
      ok(`Firebase Android 패키지: ${EXPECTED_PACKAGE} (${gsPath.replace(root + '/', '')})`);
    } else {
      fail(`Firebase 패키지 불일치 — ${packages.filter(Boolean).join(', ') || '(없음)'}`);
    }
  } catch (error) {
    fail(`google-services.json 파싱 실패: ${error.message}`);
  }
}

section('스토어 자산 (로컬)');
const storeAssets = [
  ['docs/store/play-icon-512.png', 'Play 아이콘 512'],
  ['docs/store/feature-graphic-1024x500.png', '피처 그래픽 1024×500'],
  ['docs/legal/privacy.html', '개인정보처리방침 HTML'],
];
for (const [rel, label] of storeAssets) {
  const path = join(root, rel);
  if (existsSync(path)) ok(`${label}: ${rel}`);
  else warn(`${label} 없음 — ${rel}`);
}

section('production AAB (외장)');
if (!existsSync(AAB_RELEASES_DIR)) {
  warn(`releases 폴더 없음 — 외장 미연결 또는 아직 다운로드 안 함: ${AAB_RELEASES_DIR}`);
} else {
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(AAB_RELEASES_DIR).filter((f) => f.endsWith('.aab'));
  if (files.length === 0) {
    warn('releases/에 .aab 없음 — `npm run store:download-aab` 또는 EAS에서 다운로드');
  } else {
    for (const file of files.sort()) {
      const full = join(AAB_RELEASES_DIR, file);
      const mb = (statSync(full).size / (1024 * 1024)).toFixed(1);
      ok(`AAB: ${file} (${mb} MB)`);
    }
  }
}

section('Play Console — 개발자 등록 확인 (수동)');
console.log(`
Play Console에 로그인한 뒤 아래 순서로 확인하세요.
(https://play.google.com/console)

1) 개발자 계정 ($25 등록·결제)
   설정 → 개발자 계정
   - 계정 유형·표시명 "${DEVELOPER_NAME}" · 결제 프로필이 보이면 기본 등록 완료

2) 계정 설정 완료 여부 (홈 상단 배너)
   - 「앱을 게시하려면 개발자 계정 설정을 완료하세요」 → 세부정보 보기
   - 각 항목: 본인 확인 · Android 기기 인증 · 연락처 전화 · 입금 계좌

3) 본인 확인 상태
   설정 → 개발자 계정 → 본인 확인
   - 「진행 중」→ 영업일 1~3일 대기 (2026-08-22 제출 기준)
   - 「완료」→ 다음 단계로

4) Android 개발자 인증 (2026 정책 — 패키지 등록)
   홈 배너 또는 설정 → Android 개발자 인증
   - 앱을 Play에 올린 뒤 자동 등록되거나, 수동으로 서명 키 스니펫 업로드
   - 패키지: ${EXPECTED_PACKAGE}
   - 미완료 앱은 2026-09-30 이후 삭제될 수 있음 (Google 공지 기준)

5) 앱 레코드 존재 여부
   모든 앱
   - 「운명人지도」가 있으면 앱 등록됨
   - 없으면 §7 play-listing-checklist.md — 앱 만들기

6) 내부 테스트 AAB 업로드 여부
   앱 선택 → 테스트 → 내부 테스트
   - 빌드가 올라가 있으면 업로드 완료

로컬에서 Play 승인 상태는 API 없이는 확인 불가합니다.
콘솔 화면 캡처를 보내주시면 남은 항목을 짚어 드릴 수 있습니다.
`);

section('등록 시 필요한 고정값');
console.log(`패키지명:     ${EXPECTED_PACKAGE}`);
console.log(`개발자 표시:  ${DEVELOPER_NAME}`);
console.log(`지원 이메일:  ${SUPPORT_EMAIL}`);
console.log(`개인정보 URL: ${PRIVACY_URL}`);

console.log('\n-- 요약 --');
if (failures > 0) {
  console.error(`로컬 검증 실패 ${failures}건, 경고 ${warnings}건`);
  process.exit(1);
}
console.log(`로컬 검증 통과 (경고 ${warnings}건). Play Console 상태는 위 수동 절차로 확인하세요.`);
