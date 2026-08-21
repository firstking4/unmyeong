import type { TarotSpreadKind } from '@/lib/tarotSpread';

/**
 * 질문 스프레드 보상형 해금(광고 스탠드인).
 * 광고 1회 → 티켓 1장 → 해당 유형 결과 1회.
 * 선택 화면으로 돌아오면 티켓을 비운다(같은 티켓 재진입 불가).
 */
const activeTickets = new Map<string, TarotSpreadKind>();

/** 광고 시청(또는 스탠드인) 직후 발급. 결과 라우트 params에 넣는다. */
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
