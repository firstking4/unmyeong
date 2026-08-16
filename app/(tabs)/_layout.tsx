import { Link, Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { body } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';
import { BrandWordmark } from '@/components/ink/BrandWordmark';
import { HamburgerIcon } from '@/components/ui/HamburgerIcon';
import { TabIconImage } from '@/components/TabIconImage';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleAlign: 'left',
        headerTitle: () => <BrandWordmark tint={colors.tint} text={colors.text} />,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: {
          fontFamily: body,
          fontSize: 11,
          lineHeight: 15,
          fontWeight: '500',
          letterSpacing: 0.2,
          includeFontPadding: false,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 96 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '지도',
          tabBarAccessibilityLabel: '지도',
          tabBarIcon: ({ focused }) => <TabIconImage name="home" focused={focused} size={28} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable style={{ marginRight: 16 }} hitSlop={10}>
                {({ pressed }) => (
                  <View style={{ opacity: pressed ? 0.5 : 1 }}>
                    <HamburgerIcon color={colors.text} />
                  </View>
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="seonghyang"
        options={{
          title: '성향',
          tabBarAccessibilityLabel: '성향',
          tabBarIcon: ({ focused }) => (
            <TabIconImage name="seonghyang" focused={focused} size={30} />
          ),
        }}
      />
      <Tabs.Screen
        name="saju"
        options={{
          title: '사주',
          tabBarAccessibilityLabel: '사주',
          tabBarIcon: ({ focused }) => <TabIconImage name="saju" focused={focused} size={30} />,
        }}
      />
      <Tabs.Screen
        name="tarot"
        options={{
          title: '타로',
          tabBarAccessibilityLabel: '타로',
          tabBarIcon: ({ focused }) => <TabIconImage name="tarot" focused={focused} size={30} />,
        }}
      />
      <Tabs.Screen
        name="gunghap"
        options={{
          title: '지인',
          tabBarAccessibilityLabel: '지인',
          tabBarIcon: ({ focused }) => <TabIconImage name="gunghap" focused={focused} size={30} />,
        }}
      />
    </Tabs>
  );
}
