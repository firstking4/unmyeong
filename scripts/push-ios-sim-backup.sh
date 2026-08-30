#!/usr/bin/env bash
# Expo Go(iOS 시뮬) experience Documents에 백업 JSON을 넣는다.
# 설정 → 복구 시 __DEV__에서 자동 감지된다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP="${1:-$HOME/Downloads/unmyeong-injido-backup-20260816.json}"

if [[ ! -f "$BACKUP" ]]; then
  echo "백업 파일을 찾지 못했습니다: $BACKUP" >&2
  exit 1
fi

if ! xcrun simctl list devices booted 2>/dev/null | grep -q Booted; then
  echo "부팅된 iOS 시뮬레이터가 없습니다. Simulator를 먼저 켜 주세요." >&2
  exit 1
fi

if ! xcrun simctl get_app_container booted host.exp.Exponent data >/dev/null 2>&1; then
  echo "부팅된 시뮬에 Expo Go(host.exp.Exponent)가 없습니다." >&2
  exit 1
fi

OWNER="$(node -p "require('$ROOT/app.json').expo.owner")"
SLUG="$(node -p "require('$ROOT/app.json').expo.slug")"
FILE_NAME="$(basename "$BACKUP")"

DATA_ROOT="$(xcrun simctl get_app_container booted host.exp.Exponent data)"
EXPERIENCE_DOCS="$DATA_ROOT/Documents/ExponentExperienceData/@${OWNER}/${SLUG}"
ROOT_DOCS="$DATA_ROOT/Documents"

mkdir -p "$EXPERIENCE_DOCS"
cp "$BACKUP" "$EXPERIENCE_DOCS/$FILE_NAME"
chmod 644 "$EXPERIENCE_DOCS/$FILE_NAME"

# 이전 스크립트·simctl이 루트 Documents에 넣은 사본도 유지 (앱이 상위 경로도 탐색)
cp "$BACKUP" "$ROOT_DOCS/$FILE_NAME"
chmod 644 "$ROOT_DOCS/$FILE_NAME"

echo "Expo Go experience Documents에 복사했습니다:"
echo "  $EXPERIENCE_DOCS/$FILE_NAME"
echo ""
echo "앱(Expo Go → 운명人지도)에서 설정 → 백업·복구 → 복구(불러오기)를 누르면"
echo "「시뮬 백업 발견」 알림이 뜹니다. 비밀번호 입력 후 복구하세요."
