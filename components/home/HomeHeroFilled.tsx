import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { InkPineHero } from '@/components/ink/InkPineHero';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';

/** 홈 ScrollView 좌우 패딩. */
const PAGE_PAD = space.md;
/** copy 블록 우측 패딩 + 아트가 화면 밖으로 물리는 값. */
const COPY_RIGHT_PAD = 8;
const ART_OVERHANG = 8;

const ART_MAX_W = 152;
const ART_MIN_W = 104;
const ART_RATIO = 136 / 152;

const FONT_MAX = 30;
const FONT_MIN = 16;

/** 좁은 화면에서는 소나무를 줄여 인사말에 폭을 넘긴다. */
function artWidth(windowW: number) {
  return Math.round(Math.min(ART_MAX_W, Math.max(ART_MIN_W, windowW * 0.34)));
}

/**
 * 문자열의 대략적인 em 폭. 한글·한자는 전각(1), 영숫자는 반각쯤으로 센다.
 * adjustsFontSizeToFit은 Android에서 커스텀 폰트와 물리면 축소를 건너뛰는 일이 있어
 * 실제 크기는 여기서 직접 정하고, 그건 안전망으로만 남긴다.
 */
function emWidth(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === ' ') w += 0.3;
    else if ((ch.codePointAt(0) ?? 0) > 0x1100) w += 1;
    else w += 0.55;
  }
  return w || 1;
}

export function HomeHeroFilled() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile } = useProfile();
  const name = profile.name?.trim();
  const { width: windowW } = useWindowDimensions();

  const greeting = name ? `${name}님의 오늘` : '오늘의 지도';

  const artW = artWidth(windowW);
  const artH = Math.round(artW * ART_RATIO);
  const textW =
    windowW - PAGE_PAD * 2 - (artW - ART_OVERHANG) - COPY_RIGHT_PAD;
  const fontSize = Math.round(
    Math.min(FONT_MAX, Math.max(FONT_MIN, (textW * 0.97) / emWidth(greeting))),
  );
  const artOpacity = scheme === 'dark' ? 0.48 : 0.72;

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: c.tint, fontFamily: display }]}>JIDO</Text>
        <Text
          style={{
            color: c.text,
            fontFamily: display,
            fontSize,
            lineHeight: Math.round(fontSize * 1.26),
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}>
          {greeting}
        </Text>
        <Text style={[styles.line, { color: c.muted }]}>
          운명 지도로 오늘의 흐름을{'\n'}살펴보세요.
        </Text>
      </View>
      <View style={[styles.art, { opacity: artOpacity }]}>
        <InkPineHero width={artW} height={artH} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    marginTop: 4,
    minHeight: 124,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 8,
    paddingRight: COPY_RIGHT_PAD,
    gap: 8,
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 0,
  },
  line: {
    fontSize: 13,
    lineHeight: 20,
  },
  art: {
    flexShrink: 0,
    marginRight: -ART_OVERHANG,
    marginTop: -4,
  },
});
