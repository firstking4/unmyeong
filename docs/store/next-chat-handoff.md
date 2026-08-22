# 새 채팅 핸드오프 — Play 출시 · AdMob · 트래킹

최종 갱신: **2026-08-22** · 브랜치 `main` · 앱 `0.1.3` · 패키지 `com.yun.unmyeonginjido`

이 문서는 다음 Cursor 채팅에서 **이어서 할 일**의 기준이다. 상세 체크리스트는 [`play-listing-checklist.md`](play-listing-checklist.md).

---

## 한 줄 상태

Play **개인 개발자 계정(Yun In Lab)** + AdMob **가입 완료**.  
**본인 확인·계좌 입금 확인은 진행 중(대기)**.  
앱 SDK에 **AdMob/Analytics는 아직 미연동**. production **AAB 0.1.3은 이미 빌드됨** → 지금 **재빌드 불필요**.

---

## 완료된 것 (코드·문서)

| 항목 | 위치·메모 |
|---|---|
| 약관·개인정보 화면 | `app/legal/*`, `lib/legal.ts` |
| 공개 HTML (Pages) | `https://firstking4.github.io/unmyeong/legal/privacy.html` · `…/terms.html` · 허브 `/` |
| 해금 CTA 스토어 안전화 | 「광고 보고」 제거 → 「내용 보기」/「열기」 |
| `.easignore` | 아카이브 축소 |
| Play 리스팅 체크리스트 | `docs/store/play-listing-checklist.md` |
| 스토어 그래픽 | `docs/store/play-icon-512.png`, `feature-graphic-1024x500.png` (`npm run store:graphics`) |
| AdMob ID 자리 | `lib/ads/adUnits*.ts`, `resolveAdUnits.ts` (실 ID는 `adUnits.local.ts`, gitignore) |
| 보상형 스텁 | `lib/ads/rewarded.ts` → 아직 `'unavailable'` |
| 배너 자리 | `components/home/AdBannerSlot.tsx` (플레이스홀더) |
| production AAB | EAS `18591cf7-5bbf-45c4-801b-2f6dc7dba2a8` · versionCode **1** |

---

## Play Console (진행 중)

- 개발자 표시명: **Yun In Lab** (개인 계정)
- 비즈니스 공개 정보: **제출 완료**로 문서화됨
- **본인 확인: 진행 중** → 영업일 대기 (주말 제외)
- **계좌 확인: 진행 중 / 나중 OK** (무료 앱·광고 정산은 AdMob 쪽)
- 기기 인증·전화 SMS: 본인 확인 후 또는 병행
- **앱 만들기**: 계정 설정 배너가 잠그면 대기. 열리면 `운명人지도` 생성
- **개인 계정 규칙**: 프로덕션 전 **비공개(클로즈드) 테스트** — 테스터 **최소 12명**이 **14일 연속** 옵트인 후 프로덕션 신청  
  ([공식](https://support.google.com/googleplay/android-developer/answer/14151465))

개인정보 URL (필수):  
`https://firstking4.github.io/unmyeong/legal/privacy.html`

---

## AdMob (진행 중)

- 가입됨 · 퍼블리셔 ID 예: `pub-2874731542856105` (`lib/ads/adUnits.example.ts`)
- Play와 **같은 결제 프로필** → **본인 확인 공유·같이 대기**
- 지급 설정 미완료 배너 있을 수 있음 → 본인 확인·지급 끝난 뒤 앱 심사
- **합의:** AdMob **결제/본인확인 끝난 뒤** 앱에 SDK 넣기
- 예정: 배너(`AdBannerSlot`) + 보상형(`showRewarded` → 잠금 CTA)
- Expo Go 불가 → EAS 개발/프리뷰 빌드 필요
- 광고 넣으면 방침·Play 데이터 안전성·「광고 포함」갱신 필수

---

## 트래킹 (미착수 · 논의만)

- **Google Analytics** = 앱에서는 **Firebase Analytics (GA4)**
- `@react-native-firebase/analytics` + 개발 빌드
- AdMob보다 먼저 넣어도 되지만, 넣으면 **방침/데이터 안전성** 갱신 필요
- 지금 방침: 「광고·분석 SDK 없음」

---

## 빌드 필요 여부 (2026-08-22 판정)

| 질문 | 답 |
|---|---|
| Play 내부/비공개 테스트용 AAB 새로 뽑나? | **아니요** — `0.1.3` AAB 재사용 |
| 언제 다시 빌드? | AdMob/Analytics SDK 연동 후, 또는 앱 코드·버전 bump 후 |
| versionCode | 현재 **1** — Play에 한 번 올렸으면 다음 AAB는 **2+** 필요 |

---

## 새 채팅에서 추천 순서

1. Play **세부정보 보기** — 본인 확인 끝났는지
2. Android **기기 인증** + (가능하면) 전화 SMS
3. **앱 만들기** + 스토어 등록정보 + 개인정보 URL + 그래픽
4. **내부 테스트**에 기존 AAB 업로드 → 이후 **비공개 테스트 12명×14일**
5. AdMob 본인/지급 끝나면 → 앱 추가·광고 단위 → **SDK 연동 요청 시** 구현
6. (선택) Firebase Analytics

---

## 하지 말 것 (합의)

- 본인 확인·계좌 대기 중 같은 서류 **반복 재제출**
- AdMob **실 ID로 본인 클릭** 테스트
- 사용자 명시 전 AdMob/Analytics SDK를 스토어 빌드에 넣기
- 계좌번호 등 민감을 git에 커밋

---

## 관련 규칙

- `.cursor/rules/ads-plan.mdc` — 광고 계획
- `docs/store/play-listing-checklist.md` — Console 작업 상세
