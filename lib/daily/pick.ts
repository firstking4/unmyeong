import homePack from '@/data/daily/packs/home.json';
import seonghyangPack from '@/data/daily/packs/seonghyang.json';
import sajuPack from '@/data/daily/packs/saju.json';
import tarotPack from '@/data/daily/packs/tarot.json';
import gunghapPack from '@/data/daily/packs/gunghap.json';
import physiognomyPack from '@/data/daily/packs/physiognomy.json';

export type DailyDomain =
  | 'home'
  | 'seonghyang'
  | 'saju'
  | 'tarot'
  | 'gunghap'
  | 'physiognomy';

export type DailyVariant = {
  id: string;
  keyword: string;
  headline: string;
  focus: string;
  relationship: string;
  action: string;
  caution: string;
  closing?: string;
  reverseKeyword?: string;
  /** 타로 역방향 헤드라인 — 「저울 · 기울기를 다시 재는 날」 */
  reverseHeadline?: string;
};

export type DailyPack = {
  domain: DailyDomain;
  version: number;
  variants: DailyVariant[];
};

const PACKS: Record<DailyDomain, DailyPack> = {
  home: homePack as DailyPack,
  seonghyang: seonghyangPack as DailyPack,
  saju: sajuPack as DailyPack,
  tarot: tarotPack as DailyPack,
  gunghap: gunghapPack as DailyPack,
  physiognomy: physiognomyPack as DailyPack,
};

function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function hash(input: string): number {
  let value = 0;
  for (let index = 0; index < input.length; index++) {
    value = (value * 31 + input.charCodeAt(index)) >>> 0;
  }
  return value;
}

export function localYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `localYmd` 역변환. DST 경계를 피하려고 정오로 고정한다. */
export function dateFromLocalYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

/** salt·주기로 섞은 순열. 사용자마다 순서가 다르고 한 바퀴 안에서 중복이 없다. */
function shuffledOrder(length: number, seed: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  let state = seed || 1;
  for (let i = length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order;
}

/**
 * 한 바퀴에 쓸 순열. 바퀴 첫 항목이 직전 바퀴 마지막과 같으면 한 칸 밀어
 * 경계에서 이틀 연속 같은 항목이 나오지 않게 한다.
 *
 * 보정은 순열을 만들 때 항상 적용해야 한다. 조회하는 날짜에 따라 조건부로
 * 넣으면 같은 바퀴인데도 호출마다 순서가 달라져 오히려 중복이 생긴다.
 * 길이가 3 이상이면 0↔1 교환이 마지막 항목을 건드리지 않아 직전 바퀴의
 * 마지막 값을 그대로 기준으로 쓸 수 있다.
 */
function cycleOrder(length: number, salt: string, cycle: number): number[] {
  const order = shuffledOrder(length, hash(`${salt}:${cycle}`));
  const prevLast = shuffledOrder(length, hash(`${salt}:${cycle - 1}`))[length - 1];
  if (order[0] === prevLast) {
    const tmp = order[0]!;
    order[0] = order[1]!;
    order[1] = tmp;
  }
  return order;
}

/**
 * salt로 만든 순열을 날짜로 훑어 하나를 고른다.
 *
 * 날짜에 배열 인덱스를 그대로 더하면 모든 사용자가 같은 순서로 돌기 때문에,
 * 한 바퀴(`items.length`일)마다 순열을 다시 섞는다.
 */
export function pickDailyFrom<T>(items: T[], salt: string, date = new Date()): T | null {
  const length = items.length;
  if (length === 0) return null;
  if (length === 1) return items[0]!;

  const day = dayNumber(date);
  // 두 개뿐이면 순열을 섞어도 교대 말고는 없다. salt로 시작 위치만 준다.
  if (length === 2) return items[(day + hash(salt)) % 2]!;

  const cycle = Math.floor(day / length);
  const order = cycleOrder(length, salt, cycle);
  return items[order[day - cycle * length]!]!;
}

/**
 * 날마다 다른 순서로 섞는다.
 *
 * 값 자체가 고정인 항목(띠 결·오행처럼 생년으로 정해지는 것)이 늘 같은 자리에
 * 오면 매일 같은 단어로 시작하는 것처럼 읽힌다. 자리만 돌려 그걸 막는다.
 * 한 바퀴 안 중복을 막는 `pickDailyFrom`과 달리 여기서는 순서만 바꾼다.
 */
export function shuffleDaily<T>(items: T[], salt: string, date = new Date()): T[] {
  if (items.length < 2) return [...items];
  const order = shuffledOrder(items.length, hash(`${salt}:${dayNumber(date)}`));
  return order.map((index) => items[index]!);
}

/** 날짜가 하루 바뀌면 다음 변주로. salt로 도메인·프로필별 순서. */
export function pickDaily(domain: DailyDomain, salt: string, date = new Date()): DailyVariant {
  const pack = PACKS[domain];
  const variant = pickDailyFrom(pack.variants, `${pack.version}:${salt}`, date);
  if (!variant) {
    throw new Error(`Daily pack empty: ${domain}`);
  }
  return variant;
}

/**
 * 같은 순열에서 오늘 칸부터 `count`개를 받는다.
 * 첫 칸은 `pickDaily`와 같고, 칩처럼 하루에 팩 키워드를 여러 개 쓸 때 쓴다.
 *
 * 둘째 칸부터는 이웃 칸이 아니라 `length / count` 간격으로 띄운다.
 * 이웃(p, p+1, p+2)이면 오늘 칩 3개 중 2개가 내일 다시 나오지만,
 * 간격(p, p+8, p+16)이면 날마다 전부 바뀌고 여덟 날 안에 24개를 다 본다.
 * 같은 묶음은 여덟 날 뒤 순서만 돌아 다시 오고, 바퀴(24일)가 바뀌면 새로 섞인다.
 */
export function pickDailyMany(
  domain: DailyDomain,
  salt: string,
  count: number,
  date = new Date(),
): DailyVariant[] {
  const pack = PACKS[domain];
  const variants = pack.variants;
  const n = Math.max(1, count);
  if (variants.length === 0) throw new Error(`Daily pack empty: ${domain}`);
  if (variants.length === 1) return Array.from({ length: n }, () => variants[0]!);

  const fullSalt = `${pack.version}:${salt}`;
  const day = dayNumber(date);
  if (variants.length === 2) {
    const start = (day + hash(fullSalt)) % 2;
    return Array.from({ length: n }, (_, i) => variants[(start + i) % 2]!);
  }
  const cycle = Math.floor(day / variants.length);
  const order = cycleOrder(variants.length, fullSalt, cycle);
  const position = day - cycle * variants.length;
  const stride = Math.max(1, Math.floor(variants.length / n));
  return Array.from(
    { length: n },
    (_, i) => variants[order[(position + i * stride) % variants.length]!]!,
  );
}

/**
 * 하루에 서로 다른 두 변주가 필요할 때 — 같은 순열에서 반 바퀴(12칸) 떨어진 두 칸.
 * 한 화면에서 팩 문장을 두 군데 쓸 때 같은 변주가 겹치지 않고,
 * 오늘 둘째 변주가 내일 첫 변주로 되돌아오지도 않는다.
 */
export function pickDailyPair(
  domain: DailyDomain,
  salt: string,
  date = new Date(),
): [DailyVariant, DailyVariant] {
  const [first, second] = pickDailyMany(domain, salt, 2, date);
  return [first!, second!];
}

const SPARSE_CAUTION_WORDS = ['점검', '지연', '재조정', '숨고르기', '되감기', '정비'] as const;

/**
 * 약 닷새에 하루만 주의 칩. salt에 날짜·오늘 십신을 넣지 않는다.
 * 단어는 6개 풀을 순열로 돈다.
 */
export function pickSparseCautionKeyword(salt: string, date = new Date()): string | null {
  const day = dayNumber(date);
  if ((day + hash(`${salt}:slot`)) % 5 !== 0) return null;
  return pickDailyFrom([...SPARSE_CAUTION_WORDS], `${salt}:word`, date) ?? SPARSE_CAUTION_WORDS[0];
}

/** 주의 칩이 있는 날은 팩 2 + 주의 1, 없는 날은 팩 3. */
export function withSparseCaution(
  packKeywords: string[],
  salt: string,
  date = new Date(),
  size = 3,
): string[] {
  const pack = packKeywords.filter(
    (word, index, all) => Boolean(word) && all.indexOf(word) === index,
  );
  const caution = pickSparseCautionKeyword(salt, date);
  if (!caution) return pack.slice(0, size);
  const rest = pack.filter((word) => word !== caution).slice(0, Math.max(0, size - 1));
  return [...rest, caution];
}
