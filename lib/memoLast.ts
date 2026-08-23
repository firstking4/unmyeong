/** 같은 키면 직전 결과를 재사용한다. 빌더 결과를 공유할 때(홈 운세·키워드 등). */
export function memoLast<T>(
  slot: { key: string; value: T | undefined },
  key: string,
  build: () => T,
): T {
  if (slot.key === key && slot.value !== undefined) return slot.value;
  const value = build();
  slot.key = key;
  slot.value = value;
  return value;
}
