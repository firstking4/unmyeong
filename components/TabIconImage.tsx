import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

export type TabIconName = 'home' | 'seonghyang' | 'saju' | 'tarot' | 'gunghap';

const TAB_ICON_SOURCES: Record<TabIconName, { default: ImageSourcePropType; active: ImageSourcePropType }> = {
  home: {
    default: require('@/assets/images/tabs/home.png'),
    active: require('@/assets/images/tabs/home-active.png'),
  },
  seonghyang: {
    default: require('@/assets/images/tabs/seonghyang.png'),
    active: require('@/assets/images/tabs/seonghyang-active.png'),
  },
  saju: {
    default: require('@/assets/images/tabs/saju.png'),
    active: require('@/assets/images/tabs/saju-active.png'),
  },
  tarot: {
    default: require('@/assets/images/tabs/tarot.png'),
    active: require('@/assets/images/tabs/tarot-active.png'),
  },
  gunghap: {
    default: require('@/assets/images/tabs/gunghap.png'),
    active: require('@/assets/images/tabs/gunghap-active.png'),
  },
};

type Props = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

/** PNG tab icons — editorial ink palette baked into assets. */
export function TabIconImage({ name, focused, size = 26 }: Props) {
  const source = focused ? TAB_ICON_SOURCES[name].active : TAB_ICON_SOURCES[name].default;
  return <Image source={source} style={[styles.icon, { width: size, height: size }]} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: -1,
  },
});
