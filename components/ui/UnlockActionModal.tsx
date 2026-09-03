import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { DojangSeal } from '@/components/ink/DojangSeal';
import { Text } from '@/components/Themed';
import { FortuneCastLoader } from '@/components/ui/FortuneCastLoader';
import { LatticePattern } from '@/components/ui/LatticePattern';
import { display } from '@/constants/Fonts';
import { paperShadow, radius } from '@/constants/Theme';
import {
  UNLOCK_ACTION_LABELS,
  UNLOCK_FORTUNE_COPY,
  type UnlockActionId,
} from '@/lib/unlockActions';

const wash = require('@/assets/images/ink/mountains-wash.png');
const pine = require('@/assets/images/ink/pine.png');

export type UnlockModalPhase = 'loading' | 'ready';

const POPUP = {
  paper: '#F7F1E6',
  gold: '#B8955A',
  goldSoft: '#D4B87A',
  ink: '#3A3228',
  muted: '#7A6F60',
  seal: '#B23A2F',
  bagua: '#8B6914',
};

/** 안내 문구 아래·인장·팔괘 위아래·보더 안 여백에 공통으로 쓰는 값. */
const STAGE_GAP = 18;
/**
 * 로딩(팔괘 118 + 문구)과 결과(인장 + 문구 + 버튼)가 같은 높이가 되도록 맞춘 값.
 * 카드가 내용 높이를 따라가므로, 두 단계 사이 전환에서 카드가 늘었다 줄지 않게 한다.
 */
const STAGE_MIN_HEIGHT = 218;
const REVEAL_MS = 560;
const REVEAL_GAP_MS = 240;
const LOADING_FADE_MS = 280;
const REVEAL_EASING = Easing.bezier(0.16, 1, 0.3, 1);
const REVEAL_SLIDE = 6;

type Props = {
  visible: boolean;
  phase: UnlockModalPhase;
  outcome: UnlockActionId | null;
  onSelect: (action: UnlockActionId) => void;
  onClose: () => void;
  busy?: boolean;
  /** true면 결과 요소를 즉시 전부 표시(고정 결과 재오픈). */
  instantReveal?: boolean;
};

function LoadingText() {
  return (
    <>
      <RNText style={[styles.loadingLine, { fontFamily: display }]}>{UNLOCK_FORTUNE_COPY.loadingBody}</RNText>
      <RNText style={styles.loadingHint}>{UNLOCK_FORTUNE_COPY.loadingHint}</RNText>
    </>
  );
}

/**
 * 크림 종이 레이어 팝업.
 * 금테 안: ✕ · 제목 · 본문. 인장은 결과 화면에서만 1개.
 */
export function UnlockActionModal({
  visible,
  phase,
  outcome,
  onSelect,
  onClose,
  busy = false,
  instantReveal = false,
}: Props) {
  const showLoading = phase === 'loading';
  const showResult = phase === 'ready' && outcome != null;
  const interactionLocked = showLoading || !showResult;
  const copy = outcome ? UNLOCK_FORTUNE_COPY[outcome] : null;
  const lucky = outcome === 'open_detail';

  /** 로딩 레이어 마운트(페이드아웃 중에도 유지). */
  const [loadingVisible, setLoadingVisible] = useState(false);

  const loadingOpacity = useSharedValue(0);
  const sealReveal = useSharedValue(instantReveal ? 1 : 0);
  const resultReveal = useSharedValue(instantReveal ? 1 : 0);
  const hintReveal = useSharedValue(instantReveal ? 1 : 0);
  const btnReveal = useSharedValue(instantReveal ? 1 : 0);

  useEffect(() => {
    if (!visible) {
      loadingOpacity.value = 0;
      setLoadingVisible(false);
      return;
    }

    if (instantReveal) {
      loadingOpacity.value = 0;
      setLoadingVisible(false);
      sealReveal.value = 1;
      resultReveal.value = 1;
      hintReveal.value = 1;
      btnReveal.value = 1;
      return;
    }

    if (showLoading) {
      setLoadingVisible(true);
      loadingOpacity.value = 1;
      sealReveal.value = 0;
      resultReveal.value = 0;
      hintReveal.value = 0;
      btnReveal.value = 0;
      return;
    }

    if (!showResult) {
      loadingOpacity.value = 0;
      setLoadingVisible(false);
      return;
    }

    setLoadingVisible(true);
    sealReveal.value = 0;
    resultReveal.value = 0;
    hintReveal.value = 0;
    btnReveal.value = 0;
    const timing = { duration: REVEAL_MS, easing: REVEAL_EASING };
    sealReveal.value = withTiming(1, { duration: 220, easing: REVEAL_EASING });
    resultReveal.value = withDelay(REVEAL_GAP_MS, withTiming(1, timing));
    hintReveal.value = withDelay(REVEAL_GAP_MS * 2, withTiming(1, timing));
    btnReveal.value = withDelay(REVEAL_GAP_MS * 3, withTiming(1, timing));
    loadingOpacity.value = withTiming(
      0,
      { duration: LOADING_FADE_MS, easing: REVEAL_EASING },
      (finished) => {
        if (finished) runOnJS(setLoadingVisible)(false);
      },
    );
  }, [
    visible,
    showLoading,
    showResult,
    instantReveal,
    loadingOpacity,
    sealReveal,
    resultReveal,
    hintReveal,
    btnReveal,
  ]);

  const sealStyle = useAnimatedStyle(() => ({
    opacity: sealReveal.value,
  }));
  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultReveal.value,
    transform: [{ translateY: (1 - resultReveal.value) * REVEAL_SLIDE }],
  }));
  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintReveal.value,
    transform: [{ translateY: (1 - hintReveal.value) * REVEAL_SLIDE }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnReveal.value,
    transform: [{ translateY: (1 - btnReveal.value) * REVEAL_SLIDE }],
  }));
  const loadingFadeStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={busy || interactionLocked ? undefined : onClose}
          accessibilityLabel="배경 닫기"
        />

        <View style={[styles.card, paperShadow]}>
          <LatticePattern color={POPUP.gold} opacity={0.1} />
          <Image
            source={wash}
            style={styles.wash}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <Image
            source={pine}
            style={styles.pine}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />

          <View style={[styles.innerFrame, { borderColor: POPUP.goldSoft }]}>
            <View style={styles.frameTop}>
              <View style={styles.frameTopSpacer} />
              <Pressable
                onPress={onClose}
                disabled={busy || interactionLocked}
                hitSlop={10}
                style={[styles.closeBtn, { opacity: busy || interactionLocked ? 0.35 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="닫기">
                <Text style={styles.closeX}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.header}>
              <Text style={[styles.title, { fontFamily: display }]}>
                {UNLOCK_FORTUNE_COPY.loadingTitle}
              </Text>
              <Text style={styles.subtitle}>{UNLOCK_FORTUNE_COPY.subtitle}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: POPUP.goldSoft }]} />

            <View style={styles.stage}>
              {showResult ? (
                <View style={styles.resultLayer}>
                  <Animated.View style={sealStyle}>
                    <DojangSeal size={40} color={POPUP.seal} rotate={lucky ? -8 : 8} />
                  </Animated.View>
                  <Animated.View style={resultStyle}>
                    <Text style={[styles.resultLine, { fontFamily: display }]}>{copy?.result}</Text>
                  </Animated.View>
                  <Animated.View style={hintStyle}>
                    <Text style={styles.hint}>{copy?.hint}</Text>
                  </Animated.View>
                  <Animated.View style={[styles.btnWrap, btnStyle]}>
                    <Pressable
                      disabled={busy}
                      onPress={() => outcome && onSelect(outcome)}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        { opacity: busy ? 0.55 : pressed ? 0.88 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={outcome ? UNLOCK_ACTION_LABELS[outcome] : undefined}>
                      {busy ? (
                        <ActivityIndicator color="#F7F1E6" />
                      ) : (
                        <Text style={styles.primaryLabel}>
                          {outcome ? UNLOCK_ACTION_LABELS[outcome] : ''}
                        </Text>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>
              ) : null}

              {loadingVisible ? (
                <Animated.View
                  style={[styles.loadingOverlay, loadingFadeStyle]}
                  pointerEvents={showLoading ? 'auto' : 'none'}>
                  <View style={styles.baguaGlow}>
                    <FortuneCastLoader size={100} color={POPUP.bagua} />
                  </View>
                  <LoadingText />
                </Animated.View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 23, 20, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: POPUP.paper,
    borderRadius: 22,
    padding: 10,
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    right: -40,
    top: 80,
    width: 220,
    height: 160,
    opacity: 0.12,
  },
  pine: {
    position: 'absolute',
    left: -18,
    bottom: -10,
    width: 120,
    height: 140,
    opacity: 0.14,
  },
  innerFrame: {
    borderWidth: 1.5,
    borderRadius: 16,
    // 보더→콘텐츠 여백: 좌우 14 + stage 좌우 4 = 18, 아래 18 — 사방 동일
    paddingHorizontal: 14,
    paddingBottom: STAGE_GAP,
    overflow: 'hidden',
  },
  frameTop: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  frameTopSpacer: { flex: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 15,
    color: POPUP.muted,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    color: POPUP.ink,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: POPUP.muted,
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginTop: STAGE_GAP,
    marginBottom: STAGE_GAP,
    opacity: 0.85,
  },
  stage: {
    minHeight: STAGE_MIN_HEIGHT,
    position: 'relative',
    paddingHorizontal: 4,
  },
  resultLayer: {
    alignItems: 'center',
    gap: STAGE_GAP,
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: STAGE_GAP,
    paddingHorizontal: 4,
    backgroundColor: POPUP.paper,
  },
  baguaGlow: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(212, 184, 122, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLine: {
    fontSize: 16,
    lineHeight: 22,
    color: POPUP.ink,
    textAlign: 'center',
  },
  loadingHint: {
    fontSize: 12,
    lineHeight: 18,
    color: POPUP.muted,
    textAlign: 'center',
  },
  resultLine: {
    fontSize: 19,
    lineHeight: 28,
    color: POPUP.ink,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  hint: {
    fontSize: 13,
    lineHeight: 22,
    color: POPUP.muted,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  btnWrap: {
    alignSelf: 'stretch',
  },
  primaryBtn: {
    alignSelf: 'stretch',
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    backgroundColor: POPUP.seal,
  },
  primaryLabel: {
    color: '#F7F1E6',
    fontSize: 16,
    fontWeight: '700',
  },
});
