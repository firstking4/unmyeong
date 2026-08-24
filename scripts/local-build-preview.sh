#!/usr/bin/env bash
# 로컬 preview APK 빌드 (EAS 한도 소진 시). 경로 공백 회피용 복사본에서 Gradle 실행.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${LOCAL_BUILD_DIR:-$HOME/unmyeong-injido-build}"
JAVA_HOME="${JAVA_HOME:-$HOME/jdk17}"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
GRADLE_USER_HOME="${GRADLE_USER_HOME:-/Volumes/Netac 2TB/Dev/Caches/gradle}"

if [[ ! -x "$JAVA_HOME/bin/java" ]]; then
  echo "JDK 없음 — /Users/yun/jdk17 심볼릭 링크 또는 JAVA_HOME 설정 필요"
  exit 1
fi
if [[ ! -d "$ANDROID_HOME/platforms/android-36" ]]; then
  echo "Android SDK 없음 — $ANDROID_HOME (platforms;android-36, build-tools;36.0.0, ndk)"
  exit 1
fi

mkdir -p "$BUILD_DIR"
rsync -a --delete \
  --exclude android/build --exclude android/app/build --exclude android/.gradle --exclude android/app/.cxx \
  --exclude .git --exclude .expo \
  --exclude 'node_modules/**/.cxx' --exclude 'node_modules/**/android/build' \
  "$ROOT/" "$BUILD_DIR/"

export JAVA_HOME ANDROID_HOME ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
export EXPO_PUBLIC_APP_ENV=preview
export GRADLE_USER_HOME

cd "$BUILD_DIR/android"
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon

VERSION="$(node -p "require('$BUILD_DIR/app.json').expo.version")"
OUT="$ROOT/releases/unmyeong-injido-${VERSION}-preview.apk"
mkdir -p "$ROOT/releases"
cp "$BUILD_DIR/android/app/build/outputs/apk/release/app-release.apk" "$OUT"
EXTERNAL="/Volumes/Netac 2TB/Dev/Expo/unmyeong-injido/releases/$(basename "$OUT")"
if [[ -d "$(dirname "$EXTERNAL")" && "$OUT" != "$EXTERNAL" ]]; then
  cp "$OUT" "$EXTERNAL"
fi

echo "✓ $OUT"
