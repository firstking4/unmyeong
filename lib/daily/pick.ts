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

/** 날짜가 하루 바뀌면 다음 변주로 순환. salt로 도메인·프로필별 오프셋. */
export function pickDaily(domain: DailyDomain, salt: string, date = new Date()): DailyVariant {
  const pack = PACKS[domain];
  const variants = pack.variants;
  if (variants.length === 0) {
    throw new Error(`Daily pack empty: ${domain}`);
  }
  return variants[(dayNumber(date) + hash(`${pack.version}:${salt}`)) % variants.length]!;
}
