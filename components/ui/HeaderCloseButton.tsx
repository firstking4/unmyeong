import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { CloseIcon } from '@/components/ui/CloseIcon';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

/** 스택 헤더용 닫기(X) — 누르면 이전 화면으로 */
export function HeaderCloseButton() {
  const router = useRouter();
  const c = Colors[useColorScheme() ?? 'light'];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="닫기"
      hitSlop={10}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/gunghap');
      }}
      style={({ pressed }) => [
        styles.btn,
        { opacity: pressed ? 0.5 : 1, backgroundColor: 'transparent' },
      ]}>
      <CloseIcon color={c.text} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    backgroundColor: 'transparent',
  },
});
