# 핸드오프: 탭 섹션·오늘 카드 스타일 (2026-08-16)

새 채팅 첫 메시지에 이 파일을 `@`로 붙이고, 아래 “다음 할 일”만 채우면 됨.

## 다음 할 일

(여기에 이어서 할 작업 적기)

## 현재 상태

### 공통 스타일 (`tabSection`)

사주에서 확정한 리듬을 Theme + 규칙으로 고정하고, **성향·사주·타로**에 동일 적용함.

| 토큰 | 역할 |
|---|---|
| `tabSection.cardTitle` / `title` | 26 / LH 34, display |
| `tabSection.rule` | 섹션 구분선 — `marginTop` = `paddingTop` = `space.sm`(16) |
| `tabSection.card` | 오늘 카드 셸 — padding 18, radius.lg, gap 10, marginBottom 0 |
| `tabSection.cardSplit` | **카드/섹션 안** 요약↔상세 구분선 — 위·아래 동일 `space.sm` |
| `tabSection.lead` | 리드 문단 |

- Theme: `constants/Theme.ts`
- 규칙: `.cursor/rules/tab-section-style.mdc` (alwaysApply)

### 요약 / 상세 경계 (중요)

스크린샷 기준 — **헤드라인·부제까지가 요약**, 그 아래가 상세.

**사주 `오늘의 사주` (및 이달·올해 PeriodBlock)**

- 요약: `headline` + `flowLabel` + `relation.title` + 키워드·톤 (예: 들어오는 금의 기운 / 일진 · 호랑이띠 · 금생수 / 배지)
- 상세: `LockedContentCard` 잠금 UI → CTA(내용 보기) 탭 시 `summary`·`hints` 노출 (광고 스탠드인, 세션 상태)
- 카드 헤더(`오늘의 사주`·날짜)는 요약 블록 위

**타로 `오늘의 카드`**

- 요약: 날짜·번호·카드명·정/역 + 키워드
- 상세: `LockedContentCard` → CTA 탭 시 blurb(+summary) + hints (광고 스탠드인)

**성향 TraitSection**

- 요약: 섹션 타이틀 + `title` + `meta`
- 상세: 키워드 + summary + hints + 참고(watchouts)

### 레이아웃 구현 메모

라인 위아래 여백이 같으려면 **부모 `gap`이 라인 위에 더해지면 안 됨**.

- 오늘 카드: `todayCard.gap = 0` → `cardSummary`(gap 10) + `cardSplit`
- 섹션: `block.gap = 0` → `blockSummary` + `cardSplit`
- `cardSplit`은 `marginTop` = `paddingTop` = `space.sm`만 사용 (gap 상쇄 트릭 쓰지 말 것)

### 광고 (미구현 · 잠금 UI 스탠드인)

- 규칙: `.cursor/rules/ads-plan.mdc`
- 배너 슬롯은 플레이스홀더 — AdMob SDK 넣지 말 것
- 사주·타로 오늘 카드 **상세**만 `LockedContentCard` + 탭 해금 (세션). 요약(키워드까지)은 항상 공개
- 광고 붙이면 CTA → rewarded → 같은 해금 상태로 교체

### 적용 파일

| 파일 | 내용 |
|---|---|
| `constants/Theme.ts` | `tabSection` |
| `.cursor/rules/tab-section-style.mdc` | 공통 규칙 |
| `.cursor/rules/ads-plan.mdc` | 광고 계획 |
| `app/(tabs)/saju.tsx` | 오늘 카드 + 이달/올해 요약·상세 |
| `app/(tabs)/tarot.tsx` | 오늘 카드 요약·상세 |
| `app/(tabs)/seonghyang.tsx` | TraitSection 요약·상세 + 카드 타이틀 26 |

## 화면별 명칭

- 사주: `오늘의 사주` / 카드 밖 `나의 사주`
- 타로: `오늘의 카드`
- 성향: `나의 성향 지도`

## 하지 말 것

- AdMob·수익 광고를 임의로 붙이지 않기 (사용자 요청 전)
- 요약·상세 경계를 다시 “힌트만 상세”로 되돌리지 않기
- `cardSplit` 위에 부모 `gap`을 다시 얹지 않기

## 관련 맥락 (이전 세션)

- 공유 카드 `BrushScoreRing` → share 시 `animated={false}`
- Expo Go 알림 crash → `lib/notificationsModule.ts` lazy load
- 백업 비밀번호 모달 top-fixed / busy overlay 수정
- 나의 사주(띠·오행) = 출생 고정 블록, 오늘 기운과 분리
