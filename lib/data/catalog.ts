import bloodTypes from '@/data/seed/blood-types.json';
import fiveElements from '@/data/seed/five-elements.json';
import mbti from '@/data/seed/mbti.json';
import meta from '@/data/seed/meta.json';
import physiognomy from '@/data/seed/physiognomy.json';
import tarotMajor from '@/data/seed/tarot-major.json';
import tarotMinor from '@/data/seed/tarot-minor.json';
import westernZodiac from '@/data/seed/western-zodiac.json';
import zodiacAnimals from '@/data/seed/zodiac-animals.json';

import { pickDailyFrom } from '@/lib/daily/pick';
import type { BloodType, MbtiType, ZodiacSign } from '@/lib/types';
import type { SeedCollection, SeedRecord } from './types';

const bloodCollection = bloodTypes as SeedCollection;
const mbtiCollection = mbti as SeedCollection;
const zodiacCollection = westernZodiac as SeedCollection;
const animalCollection = zodiacAnimals as SeedCollection;
const elementCollection = fiveElements as SeedCollection;
const tarotCollection = tarotMajor as SeedCollection;
const tarotMinorCollection = tarotMinor as SeedCollection;
const physiognomyCollection = physiognomy as { categories: { id: string; label: string }[]; items: SeedRecord[] };

function byLabel(items: SeedRecord[], label: string): SeedRecord | undefined {
  return items.find((item) => item.label === label);
}

export function getSeedMeta() {
  return meta;
}

export function getBloodType(type?: BloodType | string | null): SeedRecord | null {
  if (!type) return null;
  return byLabel(bloodCollection.items, type) ?? null;
}

export function getMbti(type?: MbtiType | string | null): SeedRecord | null {
  if (!type) return null;
  return byLabel(mbtiCollection.items, type.toUpperCase()) ?? null;
}

export function getZodiacAnimalRecord(label?: string | null): SeedRecord | null {
  if (!label) return null;
  const normalized = label.replace(/띠$/, '');
  return byLabel(animalCollection.items, normalized) ?? null;
}

export function getFiveElement(label?: string | null): SeedRecord | null {
  if (!label) return null;
  return byLabel(elementCollection.items, label) ?? null;
}

export function listFiveElements(): SeedRecord[] {
  return elementCollection.items;
}

export function getWesternZodiacByLabel(label?: ZodiacSign | string | null): SeedRecord | null {
  if (!label) return null;
  return byLabel(zodiacCollection.items, label) ?? null;
}

/** MM-DD 비교용 (윤년 무시, 단순 월일) */
function mdToNum(md: string): number {
  const [m, d] = md.split('-').map(Number);
  return m * 100 + d;
}

/**
 * 양력 생년월일(YYYY-MM-DD) → 황도 12궁
 * 염소자리처럼 연말~연초를 걸치는 구간 처리
 */
export function getWesternZodiac(birthDate?: string | null): SeedRecord | null {
  if (!birthDate) return null;
  const match = birthDate.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (!match) return null;
  const md = mdToNum(`${match[1]}-${match[2]}`);

  for (const item of zodiacCollection.items) {
    const range = item.dateRange;
    if (!range) continue;
    const start = mdToNum(range.start);
    const end = mdToNum(range.end);
    if (start <= end) {
      if (md >= start && md <= end) return item;
    } else if (md >= start || md <= end) {
      // wraps year (e.g. 12-22 ~ 01-19)
      return item;
    }
  }
  return null;
}

export function listTarotMajor(): SeedRecord[] {
  return tarotCollection.items;
}

/** 마이너 아르카나 56장 — 카드북·질문 스프레드용 */
export function listTarotMinor(): SeedRecord[] {
  return tarotMinorCollection.items;
}

/** 메이저 22장 + 마이너 56장 풀덱 */
export function listTarotDeck(): SeedRecord[] {
  return [...tarotCollection.items, ...tarotMinorCollection.items];
}

export function getTarotCard(idOrTitle?: string | null): SeedRecord | null {
  if (!idOrTitle) return null;
  return (
    listTarotDeck().find(
      (item) => item.id === idOrTitle || item.title === idOrTitle || item.label === idOrTitle,
    ) ?? null
  );
}

export function pickTarotBySeed(seed: string): SeedRecord {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tarotCollection.items[h % tarotCollection.items.length];
}

/**
 * 오늘의 메이저 아르카나 한 장.
 *
 * 해시 나머지로 뽑으면 같은 카드가 이틀 연속 나올 수 있고 카드별 빈도도
 * 고르지 않다. 순열을 돌면 22일 안에 22장이 한 번씩 나온다.
 * `salt`에는 날짜를 넣지 않는다 (`pickDailyFrom` 참고).
 */
export function pickDailyTarotCard(salt: string, date: Date): SeedRecord {
  return pickDailyFrom(tarotCollection.items, `tarot-card:${salt}`, date) ?? tarotCollection.items[0];
}

/** 프로필 태그용 — seed keywords 일부 */
export function getSeedInsightKeywords(input: {
  bloodType?: string | null;
  mbti?: string | null;
  zodiacAnimal?: string | null;
  element?: string | null;
  westernZodiac?: string | null;
}): string[] {
  const tags: string[] = [];
  const blood = getBloodType(input.bloodType);
  const mbtiRec = getMbti(input.mbti);
  const animal = getZodiacAnimalRecord(input.zodiacAnimal);
  const element = getFiveElement(input.element);
  const west = getWesternZodiacByLabel(input.westernZodiac);

  if (animal) tags.push(`${animal.label}띠`);
  if (element) tags.push(`${element.label}의 기운`);
  if (blood) tags.push(`${blood.label}형`);
  if (mbtiRec) tags.push(mbtiRec.label);
  if (west) tags.push(west.label);

  const extra = [blood, mbtiRec, animal, west]
    .flatMap((rec) => rec?.keywords?.slice(0, 1) ?? [])
    .filter(Boolean);
  for (const k of extra) {
    if (!tags.includes(k)) tags.push(k);
  }
  return tags.slice(0, 8);
}

export function mbtiAxisHint(letter: string): string | null {
  const map: Record<string, string> = {
    I: '내면의 기준',
    E: '밖으로 향하는 에너지',
    N: '큰 그림 감각',
    S: '현실 감각',
    T: '논리적 판단',
    F: '공감과 조화',
    J: '계획과 정리',
    P: '여유와 적응',
  };
  return map[letter] ?? null;
}

export function listPhysiognomyCategories() {
  return physiognomyCollection.categories;
}

export function listPhysiognomySeedItems(): SeedRecord[] {
  return physiognomyCollection.items;
}
