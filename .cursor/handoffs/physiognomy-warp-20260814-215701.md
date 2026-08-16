# 핸드오프: 관상 워프 (2026-08-14)

새 채팅 첫 메시지에 이 파일을 `@`로 붙이고, 아래 “다음 할 일”만 채우면 됨.

## 다음 할 일

(여기에 이어서 할 작업 적기)

## 현재 상태

- 성별 원화 + 국소 워프 레이어 방식 적용 완료
- 목 굵기 = **계란형 기준선 고정** (검증 통과)
- 자산 재생성·TS 맵·타입체크 완료
- Metro: `exp://127.0.0.1:8091`

## 핵심 규칙 (꼭 지킬 것)

1. **폭(`sx`)은 `NECK_JOIN`에서 끝난다**  
   여성 0.810 / 남성 0.790. 그 아래 목선은 원화와 동일해야 함.  
   얼굴형마다 목 굵기가 달라지는 게 지금까지 최대 문제였음.
2. **길이는 `sy`만** (`face_height` / `chin_height`). 세로 변형은 x를 안 움직여 목 굵기가 보존됨.
3. **검증**  
   `python3 scripts/build-gwansang-warps.py --verify`  
   → 목 폭 가로 변위가 0이어야 함.
4. 변화폭 조정은 `scripts/build-gwansang-warps.py`의 `OPS` / `MALE_BOX_AMP`만. 앱 코드 불필요.  
   후: `npm run gwansang:warps`

## 실패했던 방법 (다시 쓰지 말 것)

- 베이스에서 목 좁히기 (`NECK_SLIM`)
- 얼굴판/목판 분리 (곡선 마스크 + 사각 감쇠 → 잔상)
- 턱끝(`CHIN_BOTTOM`)까지 폭 밀기 (목 연결부가 최대 세기 안에 들어감)

## 읽을 파일

| 파일 | 용도 |
|---|---|
| `.cursor/rules/physiognomy-face.mdc` | 규칙·함정 전체 |
| `scripts/build-gwansang-warps.py` | 워프/박스/OPS |
| `scripts/build-gwansang-static-bases.py` | 프레이밍 (`FRAMES`) |
| `components/id-card/PhysiognomyFacePreview.tsx` | 합성 UI |
| `lib/physiognomyWarpAssets.ts` | 생성물 맵 (손수정 금지) |

## 미리보기

- `docs/design-samples/gwansang-neck-check.png` — 얼굴형별 목 비교
- `docs/design-samples/gwansang-warp-preview.png`
