/**
 * `lib/daily/pick.ts`의 검증용 사본.
 *
 * verify 스크립트는 TS 경로 별칭(`@/`)을 쓸 수 없어 로직을 그대로 옮겨 둔다.
 * `lib/daily/pick.ts`를 고치면 이 파일도 함께 고쳐야 한다.
 */

export function hashSeed(input) {
  let value = 0;
  for (let i = 0; i < input.length; i++) value = (value * 31 + input.charCodeAt(i)) >>> 0;
  return value;
}

export function dayNumber(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function shuffledOrder(length, seed) {
  const order = Array.from({ length }, (_, i) => i);
  let state = seed || 1;
  for (let i = length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

function cycleOrder(length, salt, cycle) {
  const order = shuffledOrder(length, hashSeed(`${salt}:${cycle}`));
  const prevLast = shuffledOrder(length, hashSeed(`${salt}:${cycle - 1}`))[length - 1];
  if (order[0] === prevLast) {
    const tmp = order[0];
    order[0] = order[1];
    order[1] = tmp;
  }
  return order;
}

/** `pickDailyFrom` — salt 순열을 날짜로 훑는다. */
export function pickDailyFrom(items, salt, date) {
  const length = items.length;
  if (length === 0) return null;
  if (length === 1) return items[0];

  const day = dayNumber(date);
  if (length === 2) return items[(day + hashSeed(salt)) % 2];

  const cycle = Math.floor(day / length);
  return items[cycleOrder(length, salt, cycle)[day - cycle * length]];
}

/** `pickDaily` — 팩 버전을 salt에 붙여 변주를 고른다. */
export function pickPackVariant(pack, salt, date) {
  return pickDailyFrom(pack.variants, `${pack.version}:${salt}`, date);
}
