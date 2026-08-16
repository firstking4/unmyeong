/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import {
  Text as DefaultText,
  View as DefaultView,
  StyleSheet,
  type StyleProp,
  type TextStyle,
} from 'react-native';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';
import { body } from '@/constants/Fonts';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

/** 시스템 글꼴 확대는 여기까지만 따른다 — 더 키우면 칩·세그먼트 높이가 무너진다. */
const MAX_FONT_SCALE = 1.2;

/** NotoSansKR 기준 줄 간격. Android includeFontPadding을 끈 만큼 여기서 되돌린다. */
const LINE_HEIGHT_RATIO = 1.4;

const DEFAULT_FONT_SIZE = 14;

/**
 * Android는 Text마다 폰트 패딩을 덧붙이고 한글 폰트는 상하 메트릭이 넓어서,
 * 같은 스타일이라도 iOS보다 훨씬 두꺼워진다. 패딩을 끄고 줄 간격을 직접 고정해 맞춘다.
 */
function resolveTextStyle(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style);
  if (flat?.lineHeight != null) return style;

  const fontSize = typeof flat?.fontSize === 'number' ? flat.fontSize : DEFAULT_FONT_SIZE;
  return [style, { lineHeight: Math.round(fontSize * LINE_HEIGHT_RATIO) }];
}

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, maxFontSizeMultiplier, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <DefaultText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_SCALE}
      style={resolveTextStyle([
        { color, fontFamily: body, includeFontPadding: false },
        style,
      ])}
      {...otherProps}
    />
  );
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
