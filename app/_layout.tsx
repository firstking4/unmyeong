import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { AnalyticsScreenTracker } from '@/components/AnalyticsScreenTracker';
import { useColorScheme } from '@/components/useColorScheme';
import { BackIcon } from '@/components/ui/BackIcon';
import Colors from '@/constants/Colors';
import { ContactsProvider } from '@/context/ContactsContext';
import { PersonalityResultsProvider } from '@/context/PersonalityResultsContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { RewardUnlockProvider } from '@/context/RewardUnlockContext';
import { AppThemeProvider } from '@/context/ThemeContext';
import { initAnalytics } from '@/lib/firebase/analytics';
import { getNotifications } from '@/lib/notificationsModule';
import { LocalDateProvider } from '@/lib/useLocalDateKey';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// setOptions(fade)는 개발 빌드에서만 지원 — Expo Go에서는 경고만 나고 무시됨.

getNotifications()?.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ChosunGs: require('../assets/fonts/ChosunGs.ttf'),
    NotoSansKR_400Regular,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void initAnalytics();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <RootLayoutNav />
    </AppThemeProvider>
  );
}

function RootLayoutNav() {
  const scheme = useColorScheme();
  const c = Colors[scheme];

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: c.tint,
        background: c.background,
        card: c.background,
        text: c.text,
        border: c.hairline,
        notification: c.tint,
      },
    };
  }, [scheme, c.tint, c.background, c.text, c.hairline]);

  return (
    <LocalDateProvider>
      <ProfileProvider>
        <PersonalityResultsProvider>
          <ContactsProvider>
            <RewardUnlockProvider>
              <ThemeProvider value={navTheme}>
              <AnalyticsScreenTracker />
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              <Stack
                screenOptions={{
                  headerBackImage: ({ tintColor }) => (
                    <BackIcon color={tintColor ?? c.text} size={24} />
                  ),
                  headerBackTitleVisible: false,
                }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="profile-edit"
                options={{
                  presentation: 'modal',
                  title: '프로필관리',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="personality-test"
                options={{
                  presentation: 'modal',
                  title: '성향 테스트',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                }}
              />
              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'modal',
                  title: '메뉴',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="gwansang"
                options={{
                  presentation: 'modal',
                  title: '관상',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="saju-code-share"
                options={{
                  presentation: 'modal',
                  title: '사주 코드 공유',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="history"
                options={{
                  presentation: 'modal',
                  title: '기록',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="settings"
                options={{
                  presentation: 'modal',
                  title: '설정',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="legal/privacy"
                options={{
                  presentation: 'modal',
                  title: '개인정보 처리방침',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="legal/terms"
                options={{
                  presentation: 'modal',
                  title: '이용약관',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="tarot-cardbook"
                options={{
                  presentation: 'modal',
                  title: '타로 덱',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerStatusBarHeight: 8,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="tarot-spread"
                options={{
                  presentation: 'modal',
                  title: '질문 스프레드',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen
                name="tarot-spread-result"
                options={{
                  presentation: 'modal',
                  title: '질문 스프레드',
                  headerBackVisible: true,
                  headerShadowVisible: false,
                  headerTransparent: false,
                  headerTitleStyle: { fontSize: 17 },
                }}
              />
              <Stack.Screen name="contact" options={{ headerShown: false }} />
              </Stack>
              </ThemeProvider>
            </RewardUnlockProvider>
          </ContactsProvider>
        </PersonalityResultsProvider>
      </ProfileProvider>
    </LocalDateProvider>
  );
}
