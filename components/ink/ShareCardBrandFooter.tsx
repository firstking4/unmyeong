import { StyleSheet, View } from 'react-native';

import { BrandWordmark } from '@/components/ink/BrandWordmark';
import { space } from '@/constants/Theme';

type Props = {
  tint: string;
  text: string;
  hairline: string;
};

/** 공유 이미지 전용 — 카드 하단 운명[인장]지도 워드마크. */
export function ShareCardBrandFooter({ tint, text, hairline }: Props) {
  return (
    <View style={[styles.brandBar, { borderTopColor: hairline }]}>
      <BrandWordmark tint={tint} text={text} size="card" />
    </View>
  );
}

/** 화면 밖 공유 캡처용 호스트 (visible UI에 영향 없음). */
export const shareCaptureHostStyle = {
  position: 'absolute' as const,
  left: -10000,
  top: 0,
};

export function waitFrames(n = 3) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    requestAnimationFrame(() => step(n - 1));
  });
}

const styles = StyleSheet.create({
  brandBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: space.xs,
    paddingBottom: space.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
