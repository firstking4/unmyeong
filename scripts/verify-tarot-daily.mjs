#!/usr/bin/env node
/**
 * 오늘의 타로 데일리 변주 검증 — `npm run verify:tarot-daily`
 * lib/tarot.ts pickDaily salt와 동기화 유지.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tarotMajor = JSON.parse(readFileSync(join(root, 'data/seed/tarot-major.json'), 'utf8'));
const tarotPack = JSON.parse(readFileSync(join(root, 'data/daily/packs/tarot.json'), 'utf8'));

function hashSeed(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function dayNumber(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function pickDaily(salt, date) {
  const variants = tarotPack.variants;
  return variants[(dayNumber(date) + hashSeed(`${tarotPack.version}:${salt}`)) % variants.length];
}

function pickTarotTheme(profile, date) {
  const salt = `tarot:${profile.birthDate ?? 'anon'}:${profile.mbti ?? ''}:${profile.bloodType ?? ''}`;
  return pickDaily(salt, date);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const profile = { birthDate: '1982-12-11', mbti: 'INTJ', bloodType: 'A' };
const cautions = [];
const actions = [];

for (let i = 0; i < 30; i++) {
  const date = new Date(2026, 7, 1 + i, 12);
  const theme = pickTarotTheme(profile, date);
  cautions.push(theme.caution);
  actions.push(theme.action);
}

for (let i = 1; i < cautions.length; i++) {
  assert(cautions[i] !== cautions[i - 1], `연속 동일 주의 문구: day ${i} = day ${i + 1}`);
  assert(actions[i] !== actions[i - 1], `연속 동일 한 가지 문구: day ${i} = day ${i + 1}`);
}

const fixedSuffix = '카드가 뒤집힌 날에는 결론보다 점검이 우선입니다.';
assert(
  !cautions.some((c) => c.includes(fixedSuffix)),
  '역방향 고정 접미사가 caution에 남아 있으면 안 됨',
);

console.log('verify:tarot-daily OK');
console.log(`  30일 연속 주의·한 가지 변주 확인 (pool ${tarotPack.variants.length}종)`);
