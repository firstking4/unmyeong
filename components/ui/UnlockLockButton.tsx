import { Pressable, StyleSheet, View } from 'react-native';
import { LockIcon } from '@/components/icons/AppIcon';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { radius } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

/** 광고운 해금 CTA. 오늘 카드·한 점 타로가 같은 버튼을 쓴다. */
export function UnlockLockButton({ label, onPress, disabled = false }: Props) {
  const c = Colors[useColorScheme() ?? 'light'];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.cta,
        { backgroundColor: c.tint, opacity: disabled ? 0.55 : pressed ? 0.82 : 1 },
      ]}>
      <View style={styles.ctaRow}>
        <LockIcon color="#F3EEE6" size={18} />
        <Text style={styles.ctaLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: 12,
    minHeight: 46,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaLabel: {
    color: '#F3EEE6',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
