#!/usr/bin/env node
/**
 * 지인 타로 궁합 레이어 검증 — `npm run verify:gunghap-tarot`
 * gunghapTarot.ts 알고리즘과 동기화 유지.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tarotMajor = JSON.parse(readFileSync(join(root, 'data/seed/tarot-major.json'), 'utf8'));
const tarotMinor = JSON.parse(readFileSync(join(root, 'data/seed/tarot-minor.json'), 'utf8'));
const tarotPack = JSON.parse(readFileSync(join(root, 'data/daily/packs/tarot.json'), 'utf8'));

const MAJOR_DELTA = 6;
const MINOR_DELTA = 4;
const SCORE_ORIGIN = 42;
const SCORE_SCALE_MAX = 94;

function hashSeed(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function localYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayNumber(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function pickDaily(salt, date) {
  const variants = tarotPack.variants;
  return variants[(dayNumber(date) + hashSeed(`${tarotPack.version}:${salt}`)) % variants.length];
}

function listTarotDeck() {
  return [...tarotMajor.items, ...tarotMinor.items];
}

function pickPairCard(seed) {
  const deck = listTarotDeck();
  return deck[hashSeed(seed) % deck.length];
}

function isMajorArcana(card) {
  return typeof card.number === 'number' && !card.categoryId;
}

function buildGunghapTarotReading(selfBirthDate, otherBirthDate, date) {
  const dateKey = localYmd(date);
  const seed = `gunghap-tarot:${dateKey}:${selfBirthDate}:${otherBirthDate}`;
  const card = pickPairCard(seed);
  const reversed = hashSeed(`${seed}:rev`) % 2 === 1;
  const title = card.title ?? card.label;
  const theme = pickDaily(`gunghap:${selfBirthDate}:${otherBirthDate}`, date);
  const magnitude = isMajorArcana(card) ? MAJOR_DELTA : MINOR_DELTA;
  const scoreDelta = reversed ? -magnitude : magnitude;
  return {
    cardTitle: title,
    reversed,
    orientation: reversed ? '역방향' : '정방향',
    keyword: theme.keyword,
    summaryLine: reversed
      ? `타로 · ${title} · 역방향 — ${theme.reverseKeyword ?? '점검'}`
      : `타로 · ${title} — ${theme.keyword}`,
    keywords: [`타로·${theme.keyword}`],
    scoreDelta,
  };
}

function rawTotalToTodayScore(rawTotal) {
  const scaled = ((SCORE_ORIGIN + rawTotal) / SCORE_SCALE_MAX) * 100;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const date = new Date('2026-08-24T12:00:00+09:00');
const selfBirth = '1982-12-11';
const otherBirth = '1990-05-20';

const a = buildGunghapTarotReading(selfBirth, otherBirth, date);
const b = buildGunghapTarotReading(selfBirth, otherBirth, date);
assert(a.cardTitle === b.cardTitle, '같은 날·같은 쌍은 동일 카드');
assert(a.reversed === b.reversed, '같은 날·같은 쌍은 동일 정/역');
assert(Math.abs(a.scoreDelta) === 4 || Math.abs(a.scoreDelta) === 6, 'scoreDelta는 ±4 또는 ±6');
assert(a.summaryLine.startsWith('타로 · '), 'summaryLine 접두사');
assert(a.keywords.some((kw) => kw.startsWith('타로·')), '타로 키워드 칩');

const otherDay = buildGunghapTarotReading(
  selfBirth,
  otherBirth,
  new Date('2026-08-25T12:00:00+09:00'),
);
assert(
  otherDay.cardTitle !== a.cardTitle || otherDay.reversed !== a.reversed,
  '날짜가 바뀌면 카드 또는 방향이 달라질 수 있음',
);

const before = rawTotalToTodayScore(10);
const after = rawTotalToTodayScore(10 + a.scoreDelta);
assert(after !== before || a.scoreDelta === 0, 'rawTotalToTodayScore가 delta를 반영');

console.log('verify:gunghap-tarot OK');
console.log(`  카드: ${a.cardTitle} (${a.orientation}, Δ${a.scoreDelta})`);
console.log(`  todayScore 샘플: ${before} → ${after} (raw +${a.scoreDelta})`);
