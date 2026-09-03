import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radius } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { requestAppReview } from '@/lib/requestAppReview';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

/** 해금 누적 후 중립적으로 리뷰를 제안하는 하단 토스트. */
export function ReviewPromptToast({ visible, onDismiss }: Props) {
  const c = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(120);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 120, {
      duration: visible ? 260 : 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.host, { paddingBottom: Math.max(insets.bottom, 12) + 110 }, animatedStyle]}>
      <View style={[styles.toast, { backgroundColor: c.card, borderColor: c.hairline }]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: c.text }]}>앱은 어떠신가요?</Text>
          <Text style={[styles.hint, { color: c.muted }]}>마음에 드셨다면 평가를 남겨 주세요.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="나중에"
            style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Text style={[styles.secondaryLabel, { color: c.muted }]}>나중에</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onDismiss();
              void requestAppReview();
            }}
            accessibilityRole="button"
            accessibilityLabel="평가하기"
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: c.tint, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Text style={styles.primaryLabel}>평가하기</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  toast: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
    shadowColor: '#1A1714',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  copy: { gap: 2 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  hint: { fontSize: 13, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryLabel: {
    color: '#F3EEE6',
    fontSize: 14,
    fontWeight: '700',
  },
});
