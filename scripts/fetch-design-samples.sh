#!/usr/bin/env bash
# DiceBear API로 관상 프로필 디자인 샘플 PNG를 갱신합니다.
# 사용: ./scripts/fetch-design-samples.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs/design-samples"
API="https://api.dicebear.com/7.x"

mkdir -p "$OUT"

fetch() {
  local style="$1"
  local seed="$2"
  local file="$3"
  local size="${4:-256}"
  echo "→ $file ($style / $seed)"
  curl -fsSL "${API}/${style}/png?seed=${seed}&size=${size}" -o "$OUT/$file"
}

# 레이어드 / 모던 벡터 (2안 추천)
fetch avataaars   "Avataaars-A"   avataaars.png
fetch avataaars   "Avataaars-B"   avataaars-happy.png
fetch lorelei     "Lorelei-A"     lorelei.png
fetch lorelei     "Lorelei-B"     lorelei-2.png
fetch open-peeps  "OpenPeeps-A"   open-peeps.png
fetch open-peeps  "OpenPeeps-B"   open-peeps-2.png
fetch notionists  "Notionists-A"  notionists.png
fetch notionists  "Notionists-B"  notionists-2.png

# 미니멀 / 캐릭터 변형
fetch micah       "Micah-A"       micah.png
fetch micah       "Micah-B"       micah-2.png
fetch croodles    "Croodles-A"    croodles.png
fetch croodles    "Croodles-B"    croodles-2.png
fetch big-smile   "BigSmile"      big-smile.png
fetch adventurer  "Adventurer"    adventurer.png

# 추가 참고 스타일
fetch personas    "Personas"      personas.png
fetch fun-emoji   "FunEmoji"      fun-emoji.png

echo "완료: $OUT"
