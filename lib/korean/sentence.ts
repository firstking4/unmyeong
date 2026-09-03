/**
 * 문장 조각 이어 붙이기.
 *
 * 운세 풀이는 시드 문장(마침표로 끝남)과 일일 팩 문장(`focus`·`action`·`caution`은
 * 마침표 없이 끝남)을 섞어 한 단락으로 만든다. 그대로 `join(' ')` 하면
 * `막힌 일이 풀립니다 INTJ로는 …`처럼 두 문장이 한 문장으로 붙어 읽힌다.
 */

const TERMINATORS = ['.', '!', '?', '…', '"', '’', '”', ')'];

/** 조각이 문장부호로 끝나지 않으면 마침표를 붙인다. */
export function endSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return TERMINATORS.some((mark) => trimmed.endsWith(mark)) ? trimmed : `${trimmed}.`;
}

/**
 * 끝 마침표를 떼어 낸다.
 *
 * 다른 문장 안에 절로 끼워 넣을 때 쓴다 (`… 신호를 느끼면 {조각}`).
 */
export function stripSentenceEnd(text: string): string {
  return text.trim().replace(/[.。]+$/, '');
}

/** 빈 조각을 걸러내고, 각 조각을 문장으로 닫아 한 칸 띄워 잇는다. */
/** 마침표 뒤 공백을 기준으로 문장 단위로 나눈다. 시드 데이터처럼 마침표로 끝나는 문장용. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinSentences(parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => (part ? endSentence(part) : ''))
    .filter(Boolean)
    .join(' ');
}
