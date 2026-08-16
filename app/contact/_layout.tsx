import { Stack } from 'expo-router';

import { HeaderCloseButton } from '@/components/ui/HeaderCloseButton';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// iOS 26은 헤더 아이템에 리퀴드 글래스(흰 원) 배경을 깐다.
// custom 아이템 + hidesSharedBackground로 그 배경만 끈다. (Android는 headerRight 사용)
const closeOptions = {
  headerBackVisible: false,
  headerLeft: () => null,
  headerRight: () => <HeaderCloseButton />,
  unstable_headerRightItems: () => [
    { type: 'custom' as const, element: <HeaderCloseButton />, hidesSharedBackground: true },
  ],
};

export default function ContactLayout() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen
        name="new"
        options={{
          presentation: 'modal',
          title: '지인 추가',
          ...closeOptions,
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: '궁합 상세',
          ...closeOptions,
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          presentation: 'modal',
          title: '지인 수정',
        }}
      />
    </Stack>
  );
}
