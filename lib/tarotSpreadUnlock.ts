import type { TarotSpreadKind } from '@/lib/tarotSpread';

/**
 * 한 점 타로 해금.
 * 광고운 모달 → 즉시확인 또는 광고 → 티켓 1장 → 해당 유형 결과 1회.
 * 결과를 한 번 보면 그 유형의 광고운 고정만 초기화 (`tarotSpreadFortuneLockId`).
 * RewardUnlock(자정까지)에는 넣지 않는다.
 * 선택 화면으로 돌아오면 티켓을 비운다(같은 티켓 재진입 불가).
 */
const activeTickets = new Map<string, TarotSpreadKind>();

/** 광고운 고정 키. 연애·일·선택이 서로 독립. */
export function tarotSpreadFortuneLockId(kind: TarotSpreadKind): string {
  return `tarot_spread:${kind}`;
}

/** 광고운 확인 직후 발급. 결과 라우트 params에 넣는다. */
export function issueTarotSpreadTicket(kind: TarotSpreadKind): string {
  const ticket = `${kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  activeTickets.set(ticket, kind);
  return ticket;
}

export function tarotSpreadTicketAllows(ticket: string | null | undefined, kind: TarotSpreadKind): boolean {
  if (!ticket) return false;
  return activeTickets.get(ticket) === kind;
}

/** 선택 화면 재진입 시 — 이전 열람 티켓 폐기 */
export function clearTarotSpreadTickets(): void {
  activeTickets.clear();
}
