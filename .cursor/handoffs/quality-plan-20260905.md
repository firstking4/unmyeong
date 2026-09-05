# 앱 전반 품질 개선 계획 · 시나리오 (2026-09-05)

**정본.** 품질·문구·팩·지도 취합·관상·타로 개선 때 이 파일을 연다. 포인터 규칙: `.cursor/rules/quality-plan.mdc`. AGENTS.md에도 경로가 있다.

새 채팅에서는 `@.cursor/handoffs/quality-plan-20260905.md`를 붙이고 「S1-b」처럼 시나리오만 지정해도 된다. 관련 파일을 열면 규칙이 이 문서를 가리킨다.

사람과 AI 모두 이 파일만 읽고 맥락을 잡을 수 있어야 하므로, 용어 → 코드 위치 매핑과 측정 근거를 함께 둔다.

**진행 (2026-09-05):** S1-b 진행 중 — 키워드 표 확정(E·F 승인), **saju 팩 v2 완료**, seonghyang·tarot·physiognomy·gunghap 남음. 결정 A~D 미확정. 시나리오를 끝내면 이 절과 규칙 포인터를 같이 고친다.

---

## 0. 이 프로젝트 한 장 요약

- 앱: **운명人지도** (`unmyeong-injido`). Expo 57 · React Native · TypeScript · expo-router.
- 경로: `~/Projects/unmyeong-injido` (실경로 `/Volumes/Netac 2TB/Dev/Expo/unmyeong-injido`). 항상 `~/Projects/...`로만 연다.
- 실행 `npm start`. 검증 스크립트는 `npm run check:*` · `npm run verify:*` (아래 §9).
- 화면: **지도(홈)** = 신분증 + 오늘의 운세 점수 카드. 탭 = **성향 · 사주 · 타로 · 지인(궁합)**. **관상**은 메뉴 모달에서 진입.
- 콘텐츠는 두 층으로 만든다.
  - **시드** `data/seed/*.json` — 사람에 붙는 고정 해설 (MBTI 16 · 별자리 12 · 열두 동물 12 · 혈액형 4 · 오행 5 · 타로 78 · 관상 옵션 32).
  - **일일 팩** `data/daily/packs/*.json` — 날마다 돌아가는 변주 24개 × 6 도메인 (`home` `seonghyang` `saju` `tarot` `gunghap` `physiognomy`).
- 날짜별 선택은 전부 `lib/daily/pick.ts` (`pickDailyFrom` · `pickDaily` · `pickDailyMany` · `withSparseCaution`). **salt에 날짜·오늘 십신을 넣지 않는다** — 규칙 `.cursor/rules/fortune-copy.mdc` §1.
- 점수·일진은 만세력 엔진 `lib/manseryeok/*` (`computePersonalFortuneScore`).

### 용어 → 코드

| 화면에서 부르는 말 | 코드 |
|---|---|
| 지도 · 오늘의 운세 점수 카드 | `components/IntegratedFortune.tsx` ← `buildIntegratedFortune` (`lib/fortune.ts`) |
| 오늘의 키워드 칩 · 허브 | `components/home/TodayKeywords.tsx` ← `buildTodayKeywords` (`lib/todayKeywords.ts`) |
| 오늘의 성향 카드 | `buildSeonghyangReading(...).today` (`lib/seonghyang.ts`) · 화면 `app/(tabs)/seonghyang.tsx` |
| 오늘의 사주 카드 | `buildSajuReading(...).today` (`lib/saju.ts`) · 화면 `app/(tabs)/saju.tsx` |
| 오늘의 카드 (타로) | `buildTarotReading` (`lib/tarot.ts`) · 화면 `app/(tabs)/tarot.tsx` |
| 질문 스프레드 | `lib/tarotSpread.ts` · `lib/tarotSpreadUnlock.ts` · `app/tarot-spread*.tsx` |
| 오늘의 관상 | `buildTodayPhysiognomy` · `buildPhysiognomyComposite` (`lib/physiognomy.ts`) · 화면 `app/gwansang.tsx` |
| 관상 얼굴 고르기 위저드 · 증명사진 | `components/id-card/PhysiognomyAvatarWizard.tsx` · `PhysiognomyFacePreview.tsx` · 이미지 `assets/images/gwansang/{static,warp}` · 생성 `npm run gwansang:warps` |
| 오늘의 궁합 (지인) | `buildTodayCompatibility` (`lib/gunghap.ts`) · `lib/gunghapTarot.ts` · 화면 `app/contact/[id]/index.tsx` |
| 팩 변주 1개 | `DailyVariant` = `{ id, keyword, headline, focus, relationship, action, caution, closing?, reverseKeyword? }` |
| 잠금(광고 해금) 상세 | `components/ui/LockedContentCard.tsx` · `lib/ads/rewarded.ts` · 규칙 `ads-plan.mdc` |
| 조사·문장 접합 헬퍼 | `lib/korean/particle.ts` (`withIga` `withEulReul` `withRo` …) · `lib/korean/sentence.ts` (`joinSentences` `endSentence`) |

### 반드시 지키는 규칙 파일 (`.cursor/rules/`)

`fortune-copy.mdc`(문구 전반) · `today-keywords.mdc`(칩·허브) · `tab-section-style.mdc`(섹션 레이아웃) · `tarot-spread.mdc` · `physiognomy-options.mdc` · `physiognomy-face.mdc` · `manseryeok.mdc` · `ads-plan.mdc`. 시나리오마다 관련 규칙을 아래에 다시 적었다.

### 현재 작업 트리 상태

브랜치 `feat/quality-s1-packs`에서 S1-b 진행 중. `main`에는 오늘 카드 칩 통일·허브 이동·라이트 테마·검사 스크립트가 커밋돼 있다(`a6548e4`).
S1-b 진행: **saju 팩 v2 완료** → seonghyang → tarot → physiognomy → gunghap 순 (§3 「작업 순서 · 진행」).

---

## 1. 측정으로 확인한 현재 상태 (2026-09-05)

아래 숫자는 실제 데이터·빌더를 돌려 얻은 값이다. 재현 방법은 §9.

### 1-1. 일일 팩 6개는 사실상 팩 1개다

`home / seonghyang / saju / tarot / gunghap / physiognomy` 팩을 인덱스별로 비교:

| 필드 | home과 동일한 변주 수 (24 중) |
|---|---|
| `keyword` | 24 (여섯 팩 전부 같은 24단어: 대화 호흡 시작 정리 돌봄 집중 균형 호기심 인내 용기 내려놓기 감사 경계 회복 명확 연결 규율 유연 통찰 여유 결단 조화 성장 신뢰) |
| `headline` | 24 |
| `action` | 24 |
| `caution` | 24 |
| `focus` · `relationship` | 0 — 그러나 본문은 같고 **앞에 접두어만** 다르다 |

접두어 예 (변주 `정리`): home 「성향·사주·타로가 겹친 오늘에는 …」 · seonghyang 「별자리 기운 위에서는 …」 · saju 「들어오는 오행과 맞물려 …」 (당시 코드 `cleanThemeLine`이 다시 떼어냄 — saju v2에서 접두어·함수 모두 삭제) · gunghap 「오늘의 궁합에서는 …」 · physiognomy 「고른 특징의 결 위에서는 …」 · tarot 접두어 없음. 뒤 문장 「흩어진 정보와 감정을 정리하면 선택이 선명해집니다」는 전부 동일.

결과 (현재 프로필, 60일 시뮬레이션): **21/60일(35%)은 같은 날 2개 이상 화면에 같은 문장이 그대로 뜬다.** 총 38문장. 조합: 타로+관상 16 · 지도+관상 10 · 지도+타로 5 · 성향+타로 3 · 사주+타로 2 · 성향+관상 1 · 지도+성향+관상 1.
예: 9/18 지도·관상 둘 다 「평소 안 고르던 메뉴나 경로를 시도해 보세요」.

키워드도 같은 문제다. 허브는 하루에 성향3 + 사주3 + 타로3 + 관상3 ≈ **11~12칩을 24단어 풀에서** 뽑으므로, 어떤 단어든 이틀 안에 다시 나온다. 팩 순열을 어떻게 돌려도 풀 크기 때문에 해결이 안 된다.

### 1-2. 지도(오늘의 운세) 카드는 점수·본문·칩이 세 출처다

`buildIntegratedFortuneNow` 기준:

| 층 | 출처 |
|---|---|
| **점수** | 만세력만 — 오늘 일간·일지 십신 + 이달·올해 십신 + 시주 정합 (`computePersonalFortuneScore`) |
| **헤드라인** `moodHeadline` | `home` 팩 keyword + 등급 (예 「정리 · 좋음」). **home 팩 키워드는 허브 칩에 없다**(규칙상 제외) → 헤드라인 키워드가 칩 목록에 없는 날이 대부분 |
| **본문** `summary` | ① 십신 쉬운말+톤 리드 ② 시주 정합 한 줄 ③ 띠/별자리/MBTI/혈액형 중 **하루 1줄** ④ home 팩 `focus` ⑤ 타로 `card.summary` |
| **행동** `guidance` | home 팩 `action` + 톤 가이드 + 부톤 문장 + 혈액형/MBTI `hints.growth` 풀 |
| **주의** `caution` | home 팩 `caution` + `relationship` |
| **칩** | 성향·사주·타로·관상 **오늘 카드의 칩** (`buildTodayKeywords`) |

→ **성향 오늘 카드와 관상은 본문에 한 문장도 없다.** 칩에서 「관상 · 정리」를 눌러 관상 탭에 가지만 지도 본문은 관상을 언급하지 않는다. 「취합」이라기보다 사주 본문 + 타로 한 줄 + 4탭 칩이 나란히 있는 구조.

### 1-3. 관상은 고른 7부위 중 하루 1부위만 해설한다

- 옵션 32개 (얼굴형5 · 이마4 · 눈8 · 코4 · 입4 · 턱3 · 눈썹4). 워프 이미지 48종 × 남/여 (`assets/images/gwansang/warp/options.json`).
- `buildTodayPhysiognomy`: `featured` 부위 1개를 날마다 돌려 그 옵션 `summary` + 팩 `focus`. 힌트도 그 옵션 `hints.love/work` + 팩.
- `buildPhysiognomyComposite`(상설 해설): `summaries.slice(0, 3).join(' ')` — **앞 3부위만** 정적 접합, 힌트는 **첫 부위** 것만(`loveHints[0]`). 부위 간 상호작용 문장 없음.
- 옵션 시드 두께: `summary` ≈ 47자, `hints` 각 19~27자.

### 1-4. 타로 스프레드는 포지션·질문유형이 문장에 반영되지 않는다

`drawTarotSpread` (`lib/tarotSpread.ts`):

```ts
const interpretation =
  (reversed ? card.reversed : card.hints?.[definition.hintKey] ?? card.upright) ?? card.summary;
```

- 포지션 이름(「현재 관계」·「관계의 흐름」…)이 해석 문장에 안 들어간다 — 같은 카드는 어느 자리에 놓여도 같은 문장.
- **역방향이면 질문유형(연애/일/선택)이 무시**되고 `card.reversed` 한 문장(≈80자)만.
- 3장 종합 문장 없음.
- 오늘의 카드(`buildTarotReading`)의 역방향 폴백은 1문장 고정 (`…기운이 안쪽으로 가라앉아 있습니다. 속도를 낮추고 … 점검해 보세요`).

### 1-5. 시드 두께

| 시드 | 개수 | `summary` | `hints` 3개 각 | `dailyHints` |
|---|---|---|---|---|
| MBTI | 16 | ≈151자 | ≈57자 | 없음 |
| 별자리 | 12 | ≈95자 | ≈32자 | 없음 |
| 열두 동물 | 12 | ≈62자 | 19~31자 | 없음 |
| 혈액형 | 4 | — | — | 6개 (지도 `hintPool`에 쓰임) |
| 관상 옵션 | 32 | ≈47자 | 19~27자 | 없음 |
| 타로 메이저 | 22 | ≈58자 | love/work/growth | `upright` ≈73자 · `reversed` ≈80자 · 키워드 12 |
| 타로 마이너 | 56 | 동일 구조 | | 이미지 78장 완비 |

### 1-6. UI/UX 관찰

- 홈 순서: `HomeHeroFilled` → `IdentityCard` → `ShareBannerSlot` → **`AdBannerSlot`** → `IntegratedFortune` → `DestinyQuote`. 광고 배너가 핵심 콘텐츠(운세 카드) **위**에 있다.
- 잠금은 `LockedContentCard` 하나로 성향·사주·타로·지인 통일 — 일관성 문제 없음.
- 관상 위저드는 카테고리 탭 + 증명사진 미리보기 구조 — 유지.
- 기본 테마 라이트 반영 완료 (`app.json` `userInterfaceStyle: light`, `ThemeContext`).

---

## 2. 시나리오 목록과 우선순위

| # | 시나리오 | 왜 이 순서인가 | 크기 |
|---|---|---|---|
| **S1** | 일일 팩 분리 (도메인별 어휘·문장) | 「어색한 문맥·반복」의 근본 원인. 다른 문구 작업의 전제 | 코드 반나일 + 콘텐츠 ≈ 600문장 |
| **S2** | 지도 취합 재설계 (점수·본문·칩 출처 일치) | 사용자가 가장 먼저 보는 카드. S1 팩이 갈라지면 본문에 각 탭 한 줄씩 넣을 재료가 생김 | 2~3일 |
| **S3** | 관상 — 조합 해설 → 시드 두께 → 옵션·이미지 | 선택지를 늘리기 전에 「고른 게 해설에 나오는」 구조부터 | 단계별 |
| **S4** | 타로 — 스프레드 3축 해석 + 역방향 힌트 | 데이터(78×3) 작성이 대부분 | 콘텐츠 234문장 + 코드 1일 |
| **S5** | 시드 두께 (별자리·동물·MBTI dailyHints) | 상설 섹션 읽을 거리 + 지도 힌트 풀 확장 | 콘텐츠 |
| **S6** | UI/UX (배너 위치·출처 표기·빈 상태·잠금 톤) | S2와 같이 하면 효율적 | 1~2일 |

의존 관계: **S1 → S2** (S2 본문이 S1 팩 문장을 쓴다). S3·S4·S5는 서로 독립. S6는 S2와 병행.
권장 진행: S1-a(즉시) → S2 → S1-b → S5 → S4 → S3 → S6 마무리. 콘텐츠 작성(S1-b·S4·S5)은 코드 작업과 병렬로 다른 세션에서 진행 가능.

---

## 3. S1 — 일일 팩 분리

### 목표

- 팩 6개가 **서로 다른 어휘와 문장**을 가진다. 같은 날 두 화면에 같은 문장이 뜨지 않는다.
- 허브 칩 풀이 24 → 도메인별 24(성향·사주·타로·관상 합 96)로 늘어나 같은 칩의 재등장 주기가 이틀 → 3주 이상이 된다.

### S1-a. 즉시 조치 (코드만, 반나일) — 선택

콘텐츠 작성 전까지 같은 날 교차 중복만 막는 임시 조치. S1-b가 끝나면 필요 없어지므로 **작성 여력이 있으면 건너뛰고 S1-b로 바로 간다.**

- `lib/daily/pick.ts`에 `pickDailySlots(domain, personSalt, count, date)` 추가: 순열은 **사람 단위 salt 하나**(`daily-slot:${birthDate}`)로 만들고, 도메인별 **고정 오프셋**으로 칸을 나눈다 (home 0 · seonghyang 1~3 · saju 4~6 · tarot 7~8 · physiognomy 9~11). 24칸 ≥ 12칸이므로 같은 날 겹칠 수 없다.
- 지인(`gunghap`)은 `pairSeed`가 salt라 지인마다 달라야 하므로 제외 (다른 화면이기도 함).
- 부작용: 어제 사주에 있던 변주가 오늘 성향에 올 수 있다(24단어 풀 한계). 임시 조치임을 주석에 남긴다.
- 검증: §9 교차 중복 스크립트 → `0/60일`.

### S1-b. 팩 재작성 (본 작업)

`home`은 「종합」 팩으로 두고, 나머지 5개 팩을 **도메인 어휘로** 새로 쓴다. 필드 구조·개수(24)는 유지한다.

**도메인별 키워드 24개 — 확정 (2026-09-05 사용자 승인, 결정 E)**

| 팩 | 키워드 24 | 문장 재료 |
|---|---|---|
| `saju` ✅ v2 | 오행 일상어 — 목 5 · 화 4 · 토 5 · 금 5 · 수 5: 뿌리 · 새순 · 틔우기 · 씨앗 · 자리잡기 / 불씨 · 온기 · 밝히기 · 데우기 / 밑거름 · 다지기 · 갈무리 · 채우기 · 비우기 / 벼리기 · 거두기 · 매듭 · 결실 · 식히기 / 물꼬 · 물길 · 스미기 · 머무름 · 고요 | 들어오는 기운 vs 내 기운, 채우기/비우기 구조. 십신 명칭 금지. **`focus`·`action`·`caution`에 「오늘」을 쓰지 않는다** — 같은 팩이 주·월·년 블록 요약에도 붙는다 |
| `seonghyang` | 기질·리듬: 몰입 · 거리감 · 즉흥 · 꼼꼼함 · 말수 · 온도 · 속도 · 관찰 · 직진 · 리듬 · 취향 · 눈치 · 유머 · 솔직함 · 느긋함 · 기민함 · 진지함 · 장난기 · 뚝심 · 융통성 · 감수성 · 실행력 · 상상력 · 소신 | 「평소의 나」와 오늘의 어긋남/맞물림 — MBTI·별자리 언급 없이 기질 동사 |
| `tarot` | 카드 상징: 여정 · 직감 · 저울 · 전환 · 등불 · 문턱 · 수확 · 침묵 · 손잡기 · 뒤집기 · 별빛 · 바퀴 · 열쇠 · 새벽 · 우물 · 나침반 · 실타래 · 거울 · 다리 · 지팡이 · 항해 · 날개 · 정원 · 왕관 | 이미지·장면 문장. `reverseKeyword` 6종 유지(점검·지연·재조정·숨고르기·되감기·정비). **템플릿 손질 필요** — `lib/tarot.ts`의 「{키워드} 쪽에서 점검해 보세요」·「{키워드}를 다시 맞출 날」은 추상어용이라 상징어(저울·우물)에 어색하다. 타로 팩 차례에 템플릿을 장면형으로 바꾼다 |
| `physiognomy` | 인상·표정·태도: 눈맞춤 · 첫인상 · 표정 · 자세 · 미소 · 시선 · 목소리 · 여백 · 단정함 · 너그러움 · 끄덕임 · 말투 · 걸음 · 손짓 · 온화함 · 눈빛 · 옷차림 · 인사 · 웃음 · 침착함 · 다정함 · 기품 · 얼굴빛 · 어깨 펴기 | 「오늘 남에게 어떻게 보이는가」 — 부위 이름 없이 인상 행동. **헤드라인 중복 버그** — `app/gwansang.tsx`가 `theme.keyword`와 `theme.headline`(키워드 포함)을 함께 그려 「정리 · 정리 · 정리한 만큼…」이 된다. 관상 팩 차례에 화면 쪽을 함께 고친다 |
| `gunghap` | 관계 행위 (칩만 쓰임): 안부 · 경청 · 양보 · 약속 · 맞장구 · 간격 · 사과 · 초대 · 기다림 · 공유 · 칭찬 · 부탁 · 응원 · 배려 · 속마음 · 농담 · 답장 · 마중 · 축하 · 나눔 · 인정 · 존중 · 챙기기 · 물어보기 | 두 사람의 오늘 행동. 사람 판정(낙인) 금지 — `fortune-copy.mdc` §4 |

`home` 키워드(집중·정리·대화·회복·신뢰 …)·주의 단어(점검·지연·마찰 …)와 겹치는 낱말은 없다. 네 팩 사이 교집합도 0.

**작성 규칙 (한 문장도 예외 없음)**

1. `focus` `relationship` `action` `caution`은 **마침표 없이** 끝낸다 (`joinSentences`가 붙임). `headline`은 `키워드 · 문장` 형식, `closing`은 마침표 있음.
2. 접두어(「별자리 기운 위에서는」·「오늘의 궁합에서는」) **금지** — 라벨과 리드가 이미 그 역할 (`fortune-copy.mdc` §8). saju의 `cleanThemeLine`은 삭제했다(`joinSentences`가 마침표를 맞춘다).
3. 조사 병기(`을(를)`) 금지, `·`로 이은 낱말 묶음을 문장 안에 넣지 않기, 「쪽」 남발 금지 (`fortune-copy.mdc` §2·§9).
4. 부정·낙인 표현 금지 — 조심할 점은 「오늘 할 행동」으로만.
5. `keyword`는 **팩 안에서 24개 모두 고유**, 그리고 **성향·사주·타로·관상 네 팩 사이에서도 고유** (허브가 단어 기준으로 중복 제거하므로 겹치면 한 탭 칩이 사라진다). `home`·`gunghap`은 허브에 안 들어가 겹쳐도 되지만 피하는 편이 낫다.
6. `home`의 `closing`은 현재 고유값 4개 → 24개 모두 다르게.
7. 새 주의 단어를 넣으면 `lib/keywordPolarity.ts` `NEGATIVE_LABELS`에 추가 (칩 색·주의 판정).
8. `data/daily/meta.json`·각 팩 `version`을 올린다 — salt에 version이 들어가 순열이 새로 섞인다.

**팩 필드가 어디에 보이는지 (작성자용)**

| 팩 | keyword | headline | focus | relationship | action | caution |
|---|---|---|---|---|---|---|
| home | 지도 헤드라인·luckTags | 미사용 | 지도 본문 | 지도 주의 | 지도 행동 | 지도 주의 |
| seonghyang | 칩·요약 「‘키워드’ 흐름」 | 카드 헤드라인 | 요약 | 힌트 관계 | 힌트 오늘의 한 가지 | 힌트 주의 |
| saju | 칩 (오늘 3 · 주/월/년 1) | 만세력 없을 때 폴백 「금의 기운, {headline}」 | 오늘·주·월·년 요약 둘째 문장 | — | 기간 카피 없을 때 폴백 | 기간 카피 없을 때 폴백 |
| tarot | 칩·헤드라인 | 정방향 헤드라인 | blurb | 힌트 관계 | 힌트 오늘의 한 가지 | 힌트 주의 (+theme2 caution) |
| physiognomy | 칩·헤드라인 | 헤드라인 | 요약 | 힌트 관계 | 힌트 일·재능 | 힌트 오늘의 주의 |
| gunghap | 칩 | 미사용 | 미사용 | 미사용 | 미사용 | 미사용 |

- **`gunghap` 팩은 현재 `keyword`만 쓴다** (`lib/gunghap.ts` 1156행). 문장 필드는 죽은 데이터라 §1-1 측정에서 지인 충돌이 0이었다. S1-b에서 지인은 키워드 24개만 새로 쓰고, 문장은 지인 풀이에 팩을 쓸 계획이 생길 때 채운다.
- 정확한 사용 위치는 각 빌더에서 `theme.` 검색으로 재확인 (`rg "theme2?\.(headline|focus|relationship|action|caution)" lib`).

**작업 순서 · 진행**

1. ✅ 키워드 24개 표 확정 (위 표).
2. ✅ `saju` 팩 v2 (2026-09-05). 이어서 `seonghyang` → `tarot`(템플릿 손질 포함) → `physiognomy`(헤드라인 중복 수정 포함) → `gunghap`(키워드만). 각 팩마다 화면 렌더 확인 → §9 검사 → 사용자 검수 → 커밋.
3. ✅ `cleanThemeLine` 삭제. ✅ `check:today-crosstab` 등록 — 스키마(24개 · 필드 누락 0 · 문장 끝 마침표 0 · 조사 병기 0 · keyword 팩 안 고유 · 네 탭 간 고유) + 팩 간 동일 문장 + 같은 날 교차 중복. **남은 팩 4개가 끝날 때까지는 실패가 정상**이다.
4. 팩 5개 끝난 뒤 `data/daily/meta.json` version 올리고 §9 전부 통과 → S1 완료.

**사주 단계에서 함께 고친 코드 (`lib/saju.ts`)**

- 팩 순열 salt에서 날짜를 뺐다. 이전에는 `seed: \`${ymd(date)}:${birthDate}:day\``가 `pickDailyMany`에 그대로 들어가 순열이 **매일 다시 섞여** 사실상 무작위였다 (`fortune-copy.mdc` §1 위반). 이제 `themeSalt: \`${birthDate}:day|week|month|year\``. 날짜 든 `seed`는 힌트 회전(`hintLines`)에만 남는다.
- 오늘 → 주 → 월 → 년 블록이 앞 블록의 팩 변주(`PeriodReading.themeId`)를 피한다 (`pickPeriodThemes`). 한 화면에 같은 focus 문장이 두 번 보이던 날 9/60 → 0/60.
- 다른 팩을 쓸 때 **같은 점검**을 한다: 그 도메인 빌더의 salt에 날짜·오늘 카드·오늘 십신이 들어가는지, 같은 화면의 두 블록이 한 팩을 쓰는지.

### 완료 기준

- `npm run check:today-crosstab` 통과 — 팩 간 `action`·`caution`·`headline` 동일 문장 **0**, 네 탭 키워드 교집합 **0**, 같은 날 교차 동일 문장 **0/60일**.
- `check:today-fixed` · `check:today-repetition` · `check:today-content` · `check:today-keywords-fixed` · `verify:fortune-variety` 통과.

진행 기록: 사주 팩 v2 뒤 교차 중복 21/60 → 20/60일, 사주가 낀 조합 0. 허브 고유 칩 30 → 54.

### 하지 말 것

- 접두어만 바꿔서 「분리했다」고 하기.
- 키워드만 바꾸고 문장은 그대로 두기 (문장 충돌은 그대로 남는다).
- 팩 개수 24를 줄이기.

---

## 4. S2 — 지도 취합 재설계

### 목표

지도 카드가 **「오늘 네 탭이 말하는 것의 요약」**이 된다. 점수·헤드라인·본문·칩이 같은 출처를 가리키고, 칩을 눌러 간 탭에는 지도에서 읽은 문장과 이어지는 내용이 있다.

### 설계

`IntegratedFortune` 타입에 **출처별 한 줄** 필드를 추가한다.

```ts
type FortuneSourceLine = {
  source: '사주' | '성향' | '타로' | '관상';
  line: string;          // 한 문장, 쉬운 말
  route: string;         // 칩과 같은 탭 딥링크
};
// IntegratedFortune.sources: FortuneSourceLine[]  (관상은 profile.physiognomy 있을 때만)
```

| 출처 | 한 줄 재료 (이미 존재) |
|---|---|
| 사주 | `buildTodayLead` (십신 쉬운말 + 톤) — 현재 ① 유지. 시주 정합 ②는 있을 때 이어 붙임 |
| 성향 | `buildSeonghyangReading(profile, {}, date).today` 의 `headline` 또는 팩 `focus` 1문장 |
| 타로 | 현재 ⑤ `타로 「카드」 — card.summary` 유지 |
| 관상 | `buildTodayPhysiognomy(...)` 의 featured 문장 1개 (S3 이후엔 조합 문장) |

- **본문 `summary`** = 사주 리드 → 성향 한 줄 → 타로 한 줄 → 관상 한 줄 (4~5문장, 현재 최대 5문장과 동일 분량). 띠/별자리/MBTI/혈액형 ③ `buildBaseMeetLine`은 **성향 한 줄로 흡수**하거나 삭제 (성향 탭이 그 역할).
- **헤드라인 `moodHeadline`**: 「키워드 · 등급」에서 키워드를 **허브 첫 칩**(= 사주 오늘 팩 첫 키워드)으로 바꾸거나, 「등급 · 톤」(예 「좋음 · 관계」)으로 바꾼다. home 팩 키워드는 허브에 없으므로 현 상태는 불일치. → **사용자 결정 A**.
- **점수 근거 한 줄**: `computePersonalFortuneScore`가 돌려주는 `selfTodayTenGod` `todayBranchTenGod` `hourAlignVerdict`로 「오늘 들어오는 기운이 내 기운을 밀어 줘 72점」식 1문장. 상세 펼침 영역(`detail`)에 넣는다. 전문 코드 금지 (`fortune-copy.mdc` §7).
- **행동/주의**는 home 팩 유지 (종합 팩의 역할).
- 메모 키: `fortuneMemo` key에 `physiognomy` 선택 문자열을 추가 (관상 줄이 들어가므로). `buildTodayKeywords`와 같은 방식.
- UI (`components/IntegratedFortune.tsx`): 본문 문장 앞에 출처 라벨을 작게 붙일지(「성향」 muted 13pt), 문장만 이어 붙일지 → **사용자 결정 B**. 라벨을 붙이면 칩과 같은 `route`로 눌러 이동.

### 완료 기준

- 프로필이 완전할 때 본문에 성향·사주·타로·관상 각 1문장, 관상 미선택 시 3문장.
- 헤드라인 키워드가 칩 목록에 **항상** 존재.
- `verify:fortune-variety` 14일 반복 0, `check:today-repetition` 지도 문장 수·길이 기준 통과, 60일 동안 출처 줄이 탭 오늘 카드 문장과 **동일 변주**에서 나옴(칩 규칙과 같은 「같은 빌더 결과」 원칙).

### 하지 말 것

- 지도에 십신 명칭·오행 상생상극 코드 노출.
- 성향·관상 줄을 팩 대신 시드 고정 설명(별자리 소개 등)으로 채우기 (`fortune-copy.mdc` §6).
- 칩을 본문과 다른 빌더로 다시 만들기 (`today-keywords.mdc` 규칙 1).

---

## 5. S3 — 관상: 조합 해설 → 시드 두께 → 옵션·이미지

### S3-a. 시드 두께 (콘텐츠)

`data/seed/physiognomy.json` 32옵션: `summary` 47자 → 80~120자, `hints.love/work/growth` 각 40~60자. `cue`(위저드 한 줄)는 유지. 문장은 마침표로 끝냄. 부정 단정(「고집이 세다」) 대신 방향·결로.

### S3-b. 조합 해설 (코드 + 데이터)

목표: 고른 부위 **전부**가 해설에 반영되고, 부위 **둘의 조합** 문장이 있다.

- 데이터 `data/seed/physiognomy-pairs.json` (신규): `{ a: optionId|categoryId+axis, b: ..., line: string }`. 우선 **축 기반**으로 적게 시작 — 예: 눈 크기 × 입 크기(표현력), 이마 너비 × 턱 형(사고↔실행), 눈꼬리 × 눈썹 모양(인상 온도). 축은 `physiognomy-options.mdc`의 「숨은 축」 열을 그대로 쓴다. 조합 수는 축별 2×2 = 4문장 × 축 3개 = 12문장부터.
- `buildPhysiognomyComposite`: `summaries.slice(0,3)` → 부위 전체를 「얼굴형·이마 / 눈·눈썹 / 코·입·턱」 3묶음으로 요약 + 조합 문장 1~2개. `hints`는 첫 부위 고정 대신 부위별 힌트를 love/work/growth 라운드로빈.
- `buildTodayPhysiognomy`: featured 1부위 + **오늘의 조합 1개**를 날마다 회전 (`pickDailyFrom(pairs, salt)`). 오늘 카드에 고정 설명 통째로 싣지 않는 규칙은 유지.
- → 조합을 데이터(pairs 표)로 갈지 규칙(축 조합 템플릿)으로 갈지 **사용자 결정 C**.

### S3-c. 옵션 세분화

`physiognomy-options.mdc` 로드맵대로: 턱의 이중 턱을 형과 분리(독립 토글) → 필요 시 눈썹 길이 축. 옵션 id를 바꾸면 **시드·`OPS`/`EYE_COMPOSITES`·`physiognomyFaceParams`·`npm run gwansang:warps`·저장된 selection 마이그레이션**을 한 번에 본다. S3-b가 끝난 뒤에 한다 (해설이 못 따라가는 옵션을 늘리지 않기).

### S3-d. 이미지 합성 품질

`scripts/build-gwansang-warps.py` 파이프라인 안에서: 부위 경계 잔상(같은 상자 알파 겹침 금지 — 콤보 PNG), 눈썹 두께는 `Op.ink`+배율, 무쌍은 `lid*` 띠만. 스크린샷 비교는 `docs/design-samples/gwansang-*.png`. 베이스 남/여 2종 외 **나이·헤어 축 추가는 범위 밖** (요청 시 별도).

### 완료 기준

- 7부위 선택 시 상설 해설에 7부위 모두 언급 + 조합 문장 ≥1.
- `check:today-fixed`에서 관상 오늘 카드 고정 문장 0, `check:today-keywords-fixed` 통과.
- 위저드에서 임의 조합 20개 미리보기 잔상 없음 (스크린샷).

---

## 6. S4 — 타로: 스프레드 3축 해석 + 역방향

### S4-a. 시드 (콘텐츠, 78장 × 3)

`tarot-major.json` `tarot-minor.json`에 `reversedHints: { love, work, growth }` 추가. 각 40~70자. 현재 `reversed` 한 문장은 유지(오늘의 카드 폴백).

### S4-b. 포지션 프레임 (코드)

`TAROT_SPREADS[].positions`를 `{ label, frame }`로 확장. `frame`은 카드 문장 앞에 오는 자리 설명 1절 — 예 love: 「현재 관계에서는」 「흐름으로 보면」 「마음을 전할 때는」. `drawTarotSpread`:

```ts
const core = reversed ? card.reversedHints?.[hintKey] ?? card.reversed : card.hints?.[hintKey] ?? card.upright;
interpretation = joinSentences([`${position.frame} ${stripSentenceEnd(core)}`]);
```

조사·접합은 헬퍼로. 프레임 문구는 포지션당 2~3후보를 두고 `pickDailyFrom`이 아니라 **뽑기마다 무작위**(스프레드는 날짜 고정이 아니라 매 뽑기 새 추첨 — `tarot-spread.mdc`).

### S4-c. 3장 종합 한 줄

역방향 개수(0~3) × 질문유형(3) = 12 템플릿, 각 2후보. 결과 화면 카드 아래 한 문장. 다시 뽑기·하루 한도·기록은 **미정이므로 만들지 않는다** (`tarot-spread.mdc`).

### S4-d. 오늘의 카드 역방향 폴백

`buildTarotReading`의 `reversedCore` 폴백 1문장 → 후보 6개 이상, `pickDailyFrom(…, profileSalt)`.

### 완료 기준

- 새 스크립트: 78장 × 3유형 × 정/역 × 3포지션 렌더 → 빈 문장 0, `을(를)` 0, 마침표 중복 0.
- `verify:tarot-daily` · `verify:gunghap-tarot` 통과 (지인 타로 `gunghapTarot.ts`도 `reversedHints`를 쓸지 확인).
- 같은 카드가 다른 포지션에 놓이면 문장이 달라진다.

---

## 7. S5 — 시드 두께 (성향·지도 힌트 풀)

| 시드 | 추가·확장 |
|---|---|
| 별자리 12 | `summary` 150자 · `hints` 각 60자 · `dailyHints` 6개 |
| 열두 동물 12 | 동일 |
| MBTI 16 | `dailyHints` 6개 (summary·hints는 이미 충분) |
| 혈액형 4 | 유지 |

- `dailyHints`는 지도 `hintPool`(`lib/fortune.ts`)이 이미 읽는 필드 — 별자리·MBTI에 추가하면 코드 몇 줄로 풀이 넓어진다 (`getWesternZodiac(...).dailyHints` 합류).
- 오늘 카드에는 여전히 키워드 1개·힌트 1조각만 엮는다 (`fortune-copy.mdc` §6). 두꺼워진 본문은 **상설 섹션**(성향 조합·별자리 블록·나의 사주)에서 읽힌다.
- 문장 끝 마침표, 조사 병기 금지, 「쪽」 남발 금지.

완료 기준: `verify:fortune-variety` 통과, 시드 스키마 검사(`data/seed/meta.json` version 증가), 데이터 내 `을(를)`·`과(와)` 0.

---

## 8. S6 — UI/UX

| 항목 | 현재 | 제안 | 결정 |
|---|---|---|---|
| 광고 배너 위치 | 신분증 아래, 운세 카드 위 | 운세 카드 **아래**로 (`ads-plan.mdc` 「지도 신분증 아래」 문구 갱신) | **사용자 결정 D** |
| 지도 본문 출처 표기 | 없음 | S2 `sources` 라벨 + 탭 이동 | 결정 B |
| 빈 프로필 상태 | `buildPlaceholderFortune` 문구 있음 | 각 탭 오늘 카드 빈 상태 문구·CTA 톤 통일 점검 | — |
| 잠금 CTA 톤 | `LockedContentCard` 통일 | title/description 문구를 탭별 도메인 언어로 (「내용 보기」 → 「오늘의 사주 풀이 보기」) | — |
| 관상 위저드 | 카테고리 탭 + 미리보기 | 유지. S3-c 때 이중 턱 토글만 추가 | — |
| 탭 섹션 리듬 | `tabSection` 토큰 | 유지 (`tab-section-style.mdc`) | — |

---

## 9. 검증 명령 모음

```bash
npm run check:today-fixed            # 6탭 오늘 카드 14일 겹쳐 고정 문장 0
npm run check:today-keywords-fixed   # 오늘 카드·허브 60일 고정 칩 0
npm run check:today-repetition       # 탭별 화면 내 반복·문장 길이
npm run check:today-content          # 콘텐츠 단어 한 화면 3회 이상
npm run verify:fortune-variety       # 실제 빌더 14일 반복
npm run verify:daily-variety         # pickDaily 순열·팩 스키마
npm run check:today-crosstab         # S1 완료 기준 — 팩 스키마·팩 간 문장·같은 날 교차 중복 (아래)
npm run check:gunghap-stigma         # 지인 고정 부정 표현 0
npm run verify:tarot-daily && npm run verify:gunghap-tarot
```

**교차 중복 + 팩 스키마** — `npm run check:today-crosstab` (`scripts/check/today-crosstab-repeat.ts`, S1 완료 기준 그 자체).
팩 스키마(24개 · 필드 누락 · 마침표 · 조사 병기 · keyword 고유) → 팩 간 동일 `headline`·`action`·`caution` → 같은 날 2개 이상 화면 같은 문장(60일) 순으로 찍고, 하나라도 있으면 exit 1.
팩을 하나 바꿀 때마다 돌려서 그 도메인이 실패 목록에서 사라졌는지 본다.
(2026-09-05 saju v2 뒤: 교차 중복 20/60일, 남은 조합 타로+관상 16 · 지도+관상 10 · 지도+타로 5 · 성향+타로 3 · 성향+관상 1.)

---

## 10. 사용자 결정이 필요한 항목

| 결정 | 질문 | 기본 제안 |
|---|---|---|
| **A** | 지도 헤드라인 키워드 출처 — home 팩 유지 / 허브 첫 칩 / 「등급 · 톤」 | 허브 첫 칩 (칩과 항상 일치) |
| **B** | 지도 본문에 출처 라벨(성향·사주·타로·관상)을 붙일지 | 붙인다 — muted 13pt, 탭 이동 |
| **C** | 관상 조합 문장을 pairs 데이터로 / 축 규칙 템플릿으로 | 축 규칙 12문장부터, 부족하면 pairs |
| **D** | 광고 배너를 운세 카드 아래로 옮길지 | 옮긴다 (핵심 콘텐츠 우선) |
| **E** ✅ | S1-b 도메인별 키워드 24개 표 (§3) | **승인됨 (2026-09-05)** — §3 표가 확정본 |
| **F** ✅ | 콘텐츠 작성(S1-b 600문장 · S4-a 234문장 · S5)을 AI 초안 → 사용자 검수로 진행할지 | **AI 초안, 팩 1개씩 검수로 진행 중** (saju 완료) |

---

## 11. 하지 말 것 (전 시나리오 공통)

- `pickDailyFrom` salt에 날짜·오늘 십신·오늘 등급 넣기.
- 후보 2~3개로 「매일 바뀐다」고 보기 — 후보는 6개 이상.
- 템플릿에 조사 직접 쓰기, 팩 문장에 마침표 붙여 저장하기.
- 「오늘의 ~」 본문·칩에 사람 고정 설명(별자리 소개·MBTI 강점·십신 명칭·관상 특징 이름·띠 결) 통째로 넣기.
- 지인의 띠 결·오행·십신에 부정 평가 붙이기.
- 지도에 전문 코드(십신 명칭·상생상극) 노출.
- 스프레드에 다시 뽑기·하루 한도·기록을 임의로 추가.
- 핵심 운세·궁합을 광고 없이는 전혀 못 보게 가두기.
- Expo Go 전제로 AdMob 동작을 약속하기.
- 새 아이콘 세트(Feather·Ionicons) 추가 — Material Icons만.
- 규칙 파일을 갱신하지 않고 동작을 바꾸기 (팩 구조·칩 출처·배너 위치를 바꾸면 해당 `.mdc`도 함께).
