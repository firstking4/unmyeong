#!/usr/bin/env node
/**
 * preview APK → GitHub Releases 업로드
 * `npm run release:preview -- [tag] [apkPath]`
 *
 * 예:
 *   npm run release:preview -- preview-0.1.6
 *   npm run release:preview -- preview-0.1.7-gunghap-tarot /path/to.apk
 *
 * 토큰: GITHUB_TOKEN 또는 git credential (github.com)
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'firstking4/unmyeong';
const EXTERNAL_RELEASES = '/Volumes/Netac 2TB/Dev/Expo/unmyeong-injido/releases';
const LOCAL_RELEASES = join(root, 'releases');

function readAppVersion() {
  const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
  return app.expo?.version ?? '0.0.0';
}

function resolveApkPath(tag, explicit) {
  if (explicit && existsSync(explicit)) return explicit;
  const version = tag.replace(/^preview-/, '').replace(/-.*$/, '');
  const candidates = [
    join(EXTERNAL_RELEASES, `unmyeong-injido-${version}-preview.apk`),
    join(LOCAL_RELEASES, `unmyeong-injido-${version}-preview.apk`),
    join(EXTERNAL_RELEASES, `unmyeong-injido-${version}.apk`),
    join(LOCAL_RELEASES, `unmyeong-injido-${version}.apk`),
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  throw new Error(`APK 없음 — tag=${tag}. 빌드 후 경로를 넘기세요.`);
}

function getGithubToken() {
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim();
  const out = execFileSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
  });
  const match = out.match(/^password=(.+)$/m);
  if (!match) throw new Error('GitHub 토큰 없음 — GITHUB_TOKEN 설정 또는 gh login');
  return match[1].trim();
}

async function githubJson(token, path, { method = 'GET', body } = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${json?.message ?? text}`);
  }
  return json;
}

async function uploadAsset(token, uploadUrl, apkPath) {
  const size = statSync(apkPath).size;
  const name = basename(apkPath);
  const url = `${uploadUrl.replace('{?name,label}', `?name=${encodeURIComponent(name)}`)}`;
  const body = createReadStream(apkPath);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': String(size),
    },
    duplex: 'half',
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`APK 업로드 실패 ${response.status}: ${text}`);
  }
  return response.json();
}

async function main() {
  const tag = process.argv[2] || `preview-${readAppVersion()}`;
  const apkPath = resolveApkPath(tag, process.argv[3]);
  const token = getGithubToken();
  const sizeMb = (statSync(apkPath).size / (1024 * 1024)).toFixed(1);

  if (statSync(apkPath).size > 100 * 1024 * 1024) {
    console.warn(`⚠️ APK ${sizeMb}MB — Git 일반 파일 한도(100MB) 근접. Releases 업로드는 OK.`);
  }

  const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const branch = execFileSync('git', ['branch', '--show-current'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();

  const notes = [
    `운명人지도 Android preview APK`,
    ``,
    `- 태그: \`${tag}\``,
    `- 브랜치: \`${branch}\``,
    `- 커밋: \`${commit}\``,
    `- 파일: \`${basename(apkPath)}\` (${sizeMb} MB)`,
    ``,
    `갤럭시 등 Android에서 APK 다운로드 후 설치하세요.`,
    `(출처 불명 앱 허용 필요)`,
  ].join('\n');

  console.log(`Release 생성: ${tag}`);
  const release = await githubJson(token, `/repos/${REPO}/releases`, {
    method: 'POST',
    body: {
      tag_name: tag,
      name: `운명人지도 ${tag}`,
      body: notes,
      draft: false,
      prerelease: true,
    },
  });

  console.log(`APK 업로드: ${apkPath}`);
  const asset = await uploadAsset(token, release.upload_url, apkPath);

  const page = release.html_url;
  const direct = asset.browser_download_url;
  console.log('');
  console.log('완료');
  console.log(`  Releases: ${page}`);
  console.log(`  APK:      ${direct}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
