import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';
import { UnlockLockButton } from '@/components/ui/UnlockLockButton';
import { useUnlockFortuneFlow } from '@/components/ui/useUnlockFortuneFlow';
import Colors from '@/constants/Colors';
import { radius, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  /** 당일 광고운 고정용 키 (예: tarot_today, contact_today:abc) */
  lockId: string;
  title: string;
  description?: string;
  /** 잠금 버튼 문구·접근성 라벨. 기본값: 내용 보기 */
  ctaLabel?: string;
  onPress?: () => void | Promise<void>;
  /** 해금 후 본문. 있으면 같은 박스 안에 타이틀+본문만 보여 준다. */
  children?: ReactNode;
};

/**
 * 자물쇠 탭 → 팝업 즉시 오픈(광고운 로딩) → 즉시확인 / 광고보고확인 → 해금.
 * 당일·lockId별 광고운 결과는 한 번 정해지면 고정(재시도로 바꾸지 않음).
 * 고정된 결과는 로딩 생략. 닫을 때 phase를 loading으로 되돌리지 않아 페이드아웃 깜빡임 방지.
 */
export function LockedContentCard({
  lockId,
  title,
  description,
  ctaLabel,
  onPress,
  children,
}: Props) {
  const c = Colors[useColorScheme() ?? 'light'];
  const unlocked = Boolean(children);
  const label = ctaLabel ?? '내용 보기';
  const { beginUnlock, modal, modalOpen } = useUnlockFortuneFlow();

  return (
    <>
      <View style={[styles.card, { borderColor: c.hairline, backgroundColor: c.card }]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          {!unlocked && description ? (
            <Text style={[styles.description, { color: c.muted }]}>{description}</Text>
          ) : null}
        </View>
        {unlocked ? <View style={styles.body}>{children}</View> : null}
        {!unlocked && onPress ? (
          <UnlockLockButton
            label={label}
            disabled={modalOpen}
            onPress={() => {
              void beginUnlock(lockId, onPress);
            }}
          />
        ) : null}
      </View>

      {modal}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: 14,
    gap: 10,
  },
  copy: { gap: 3 },
  title: { ...tabSection.detailLabel, fontSize: 14, lineHeight: 20 },
  description: { ...tabSection.detailHint, fontSize: 13, lineHeight: 19 },
  body: { ...tabSection.detailStack },
});
