# 새 채팅 핸드오프 — Play 출시 · AdMob · 트래킹

최종 갱신: **2026-09-02** · 브랜치 `main` · 앱 `0.1.13` · 패키지 `com.yun.unmyeonginjido`

이 문서는 다음 Cursor 채팅에서 **이어서 할 일**의 기준이다. 상세 체크리스트는 [`play-listing-checklist.md`](play-listing-checklist.md).

---

## 한 줄 상태

Play **개인 개발자 계정(Yun In Lab)** + AdMob **가입·Android 앱·광고 단위·SDK 연동 완료** (2026-09-02).  
앱에 **AdMob SDK 포함** (`react-native-google-mobile-ads`). **네이티브 재빌드 필요** (Expo Go 불가).  
`__DEV__`/개발 빌드는 Google **테스트 광고 ID**. 실 ID는 `adUnits.local.ts`.

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
| AdMob ID · resolve | `lib/ads/adUnits*.ts`, `resolveAdUnits.ts` (`adUnits.local.ts` gitignore) |
| 보상형 | `lib/ads/rewarded.ts` → AdMob Rewarded (`earned`/`dismissed`/`unavailable`) |
| 배너 | `components/home/AdBannerSlot.tsx` (홈·메뉴) |
| AdMob 초기화 | `lib/ads/initAds.ts` · `app/_layout.tsx` |

---

## Play Console (진행 중)

- 개발자 표시명: **Yun In Lab** (개인 계정)
- Google 계정: `firstking4@gmail.com` (AdMob과 동일)
- **본인 확인: 진행 중** → 영업일 대기 (주말 제외)일 수 있음
- **계좌 확인: 진행 중 / 나중 OK** (무료 앱·광고 정산은 AdMob 쪽)
- **개인 계정 규칙**: 프로덕션 전 **비공개(클로즈드) 테스트** — 테스터 **최소 12명**이 **14일 연속** 옵트인 후 프로덕션 신청

개인정보 URL (필수):  
`https://firstking4.github.io/unmyeong/legal/privacy.html`

---

## AdMob (2026-09-02 콘솔까지 완료)

| 항목 | 값 / 상태 |
|---|---|
| 퍼블리셔 ID | `pub-2874731542856105` |
| 플랫폼 | **Android** (iOS는 나중에) |
| 앱 이름 | 운명人지도 |
| 패키지 | `com.yun.unmyeonginjido` |
| 스토어 등록 여부(AdMob 질문) | **아니요** (Play/App Store 정식 미연결·프리뷰 APK 단계) |
| 앱 ID | `ca-app-pub-2874731542856105~2623659839` ✅ |
| 배너 | `ca-app-pub-2874731542856105/8885924882` ✅ (`unmyeong_banner`) |
| 보상형 | `ca-app-pub-2874731542856105/9570692937` ✅ (`unmyeong_rewarded`) |
| 파트너 입찰 | **기본/미사용** (중개 전에 불필요) |
| 고급 설정 | **기본값** 유지 |
| `adUnits.local.ts` | ✅ Android 앱·배너·보상형 반영 |
| SDK (`react-native-google-mobile-ads`) | ✅ 연동 (2026-09-02) · 재빌드 필요 |
| `app.json` `AD_ID` | 차단 해제 (광고용) |
| iOS AdMob App ID | 플러그인에 **테스트** ID (실 iOS 앱 전) |

합의:
- `__DEV__`는 테스트 ID · 실 ID **본인 클릭** 테스트 금지
- 스토어 업로드 시 Play 「광고 포함」예 + 데이터 안전성·방침 URL 갱신
- Pages `privacy.html` 배포 필요 (`docs/legal/privacy.html` 갱신됨)

---

## 트래킹

- Firebase Analytics 플러그인은 `app.json`에 있음 (`withoutAdIdSupport` iOS)
- 방침/데이터 안전성과 맞춰 출시 설문 갱신 여부 확인

---

## 새 채팅에서 추천 순서

1. ~~AdMob 콘솔 ID → `adUnits.local.ts`~~ ✅ Android 완료
2. ~~SDK 연동~~ ✅ — **프리뷰 APK 재빌드** 후 테스트 광고 스모크
3. GitHub Pages에 `docs/legal/privacy.html` 배포
4. Play 본인 확인·앱 만들기·비공개 테스트 · 「광고 포함」예
5. (선택) iOS AdMob 앱·광고 단위 → `app.json` iosAppId 교체

---

## 하지 말 것 (합의)

- 본인 확인·계좌 대기 중 같은 서류 **반복 재제출**
- AdMob **실 ID로 본인 클릭** 테스트
- 사용자 명시 전 AdMob SDK를 스토어 빌드에 넣기
- 계좌번호·실 광고 ID를 git에 커밋 (`adUnits.local.ts`는 gitignore)

---

## 관련 규칙

- `.cursor/rules/ads-plan.mdc` — 광고 계획
- `docs/store/play-listing-checklist.md` — Console 작업 상세
