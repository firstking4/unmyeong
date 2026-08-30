#!/usr/bin/env node
/**
 * iOS 시뮬레이터(Expo Go) AsyncStorage에 백업을 직접 복원한다.
 * 앱 설정 → 복구 피커 없이 개발용으로 쓴다.
 *
 *   UNMYEONG_RESTORE_PASSWORD='비밀번호' node scripts/restore-ios-simulator-backup.mjs
 *   UNMYEONG_RESTORE_PASSWORD='비밀번호' node scripts/restore-ios-simulator-backup.mjs ~/Downloads/unmyeong-injido-backup-20260816.json
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

const INLINE_THRESHOLD = 1024;
const HISTORY_KEY = '@unmyeong/history-v1';
const PROFILE_KEY = '@unmyeong/profile';
const CONTACTS_KEY = '@unmyeong/contacts';
const EXPO_OWNER = '@winter369';
const EXPO_SLUG = 'unmyeong-injido';

function usage(msg) {
  if (msg) console.error(msg);
  console.error(
    '\n사용법:\n  UNMYEONG_RESTORE_PASSWORD=\'비밀번호\' node scripts/restore-ios-simulator-backup.mjs [백업.json]\n',
  );
  process.exit(1);
}

function base64ToBytes(value) {
  const binary = Buffer.from(value, 'base64');
  return new Uint8Array(binary);
}

function deriveKey(password, salt, iterations) {
  return pbkdf2(sha256, password, salt, { c: iterations, dkLen: 32 });
}

function decryptEnvelope(envelope, password) {
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const iterations =
    typeof envelope.iterations === 'number' && envelope.iterations > 0
      ? envelope.iterations
      : 120_000;
  const key = deriveKey(password, salt, iterations);
  const plain = gcm(key, iv).decrypt(ciphertext);
  return new TextDecoder().decode(plain);
}

function md5FileName(key) {
  return createHash('md5').update(key).digest('hex');
}

function writeAsyncStorageEntry(storageDir, key, value) {
  mkdirSync(storageDir, { recursive: true });
  const manifestPath = join(storageDir, 'manifest.json');
  let manifest = {};
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      manifest = {};
    }
  }
  if (value.length <= INLINE_THRESHOLD) {
    manifest[key] = value;
    const filePath = join(storageDir, md5FileName(key));
    if (existsSync(filePath)) {
      try {
        require('node:fs').unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }
  } else {
    manifest[key] = null;
    writeFileSync(join(storageDir, md5FileName(key)), value, 'utf8');
  }
  writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');
}

function bootedSimulatorUdid() {
  const out = execSync('xcrun simctl list devices booted -j', { encoding: 'utf8' });
  const data = JSON.parse(out);
  for (const runtime of Object.values(data.devices)) {
    for (const device of runtime) {
      if (device.state === 'Booted') return device.udid;
    }
  }
  return null;
}

function findExpoAsyncStorageDir(udid) {
  const root = join(
    homedir(),
    'Library/Developer/CoreSimulator/Devices',
    udid,
    'data/Containers/Data/Application',
  );
  const apps = execSync(`find "${root}" -maxdepth 3 -type d -name "RCTAsyncLocalStorage" 2>/dev/null`, {
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean);
  const hit = apps.find((p) => p.includes(`${EXPO_OWNER}/${EXPO_SLUG}`));
  return hit ?? apps[0] ?? null;
}

const password = process.env.UNMYEONG_RESTORE_PASSWORD?.trim();
if (!password) usage('UNMYEONG_RESTORE_PASSWORD 가 필요합니다.');

const backupPath =
  process.argv[2] ?? join(homedir(), 'Downloads/unmyeong-injido-backup-20260816.json');
if (!existsSync(backupPath)) usage(`백업 파일 없음: ${backupPath}`);

const envelope = JSON.parse(readFileSync(backupPath, 'utf8'));
if (envelope.format !== 'encrypted' || envelope.app !== 'unmyeong-injido') {
  usage('암호화된 운명人지도 백업 파일이 아닙니다.');
}

let plainJson;
try {
  plainJson = decryptEnvelope(envelope, password);
} catch {
  usage('비밀번호가 맞지 않거나 파일이 손상되었습니다.');
}

const backup = JSON.parse(plainJson);
if (!backup.profile || !Array.isArray(backup.contacts)) {
  usage('백업 내용이 올바르지 않습니다.');
}

const udid = bootedSimulatorUdid();
if (!udid) usage('부팅된 iOS 시뮬레이터가 없습니다.');

const storageDir = findExpoAsyncStorageDir(udid);
if (!storageDir) usage('Expo Go AsyncStorage 경로를 찾지 못했습니다. Expo Go에서 앱을 한 번 실행해 주세요.');

writeAsyncStorageEntry(storageDir, PROFILE_KEY, JSON.stringify(backup.profile));
writeAsyncStorageEntry(storageDir, CONTACTS_KEY, JSON.stringify(backup.contacts));
const historyStore = {
  version: 1,
  entries: Array.isArray(backup.history) ? backup.history : [],
};
writeAsyncStorageEntry(storageDir, HISTORY_KEY, JSON.stringify(historyStore));

console.log('복원 완료:', storageDir);
console.log(
  `- 프로필: ${backup.profile.name ?? '(이름 없음)'}\n- 지인: ${backup.contacts.length}명\n- 기록: ${historyStore.entries.length}건`,
);
console.log('\nExpo Go에서 앱을 완전히 닫았다가 다시 열면 반영됩니다.');
