import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { LockIcon } from '@/components/icons/AppIcon';
import { Text } from '@/components/Themed';
import { UnlockActionModal, type UnlockModalPhase } from '@/components/ui/UnlockActionModal';
import Colors from '@/constants/Colors';
import { radius, tabSection } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useReviewPrompt } from '@/context/ReviewPromptContext';
import { useProfile } from '@/context/ProfileContext';
import { showRewarded } from '@/lib/ads/rewarded';
import { buildIntegratedFortune } from '@/lib/fortune';
import {
  getAdOfferChanceForFortuneScore,
  NEUTRAL_AD_OFFER_CHANCE,
  rollAdOfferChance,
} from '@/lib/unlockAdChance';
import { useLocalDateKey } from '@/lib/useLocalDateKey';
import {
  loadGuideQuotaState,
  recordUnlock,
  saveGuideQuotaState,
} from '@/lib/guideQuota';
import { getOrRollUnlockFortuneOutcome, peekUnlockFortuneOutcome } from '@/lib/unlockFortuneOutcome';
import { resolveUnlockOutcome, type UnlockActionId } from '@/lib/unlockActions';

const UNLOCK_LOADING_MS = 2000;
/** RN Modal이 떠 있으면 AdMob rewarded가 안 뜨는 경우가 많아, 닫힌 뒤 잠깐 기다림. */
const AD_AFTER_MODAL_MS = 360;

type Props = {
  /** 당일 광고운 고정용 키 (예: tarot_today, contact_today:abc) */
  lockId: string;
  title: string;
  description?: string;
  /** 접근성 라벨. 기본값: 내용 보기 */
  ctaLabel?: string;
  onPress?: () => void | Promise<void>;
  /** 해금 후 본문. 있으면 같은 박스 안에 타이틀+본문만 보여 준다. */
  children?: ReactNode;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

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
  const { showReviewPrompt } = useReviewPrompt();
  const { profile, fortuneReady } = useProfile();
  const dateKey = useLocalDateKey();
  const fortuneScore = useMemo(() => {
    if (!fortuneReady) return null;
    return buildIntegratedFortune(profile).score;
  }, [dateKey, fortuneReady, profile]);
  const unlocked = Boolean(children);
  const a11y = ctaLabel ?? '내용 보기';

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [phase, setPhase] = useState<UnlockModalPhase>('loading');
  const [outcome, setOutcome] = useState<UnlockActionId | null>(null);
  const [busy, setBusy] = useState(false);
  /** 고정 결과로 바로 열 때 순차 등장 애니메이션 생략 */
  const [instantReveal, setInstantReveal] = useState(false);

  /** 닫을 때는 visible만 false — 내용 리셋하면 fade-out 중 로딩이 비침 */
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setBusy(false);
  }, []);

  const finishUnlock = useCallback(async () => {
    if (!onPress) return;

    const state = await loadGuideQuotaState();
    const { next, shouldPromptReview } = recordUnlock(state);
    await saveGuideQuotaState(next);
    await onPress();
    if (shouldPromptReview) {
      showReviewPrompt();
    }
  }, [onPress, showReviewPrompt]);

  const runAction = useCallback(
    async (action: UnlockActionId) => {
      if (!onPress || busy) return;
      setBusy(true);
      try {
        if (action === 'watch_ad') {
          // Modal 위에선 rewarded 표시가 막히는 경우가 있어 먼저 닫는다.
          setModalOpen(false);
          await delay(AD_AFTER_MODAL_MS);
          const result = await showRewarded();
          if (result !== 'earned') {
            Alert.alert(
              '광고를 불러오지 못했어요',
              result === 'dismissed'
                ? '광고를 끝까지 보시면 자세한 풀이가 열려요.'
                : '잠시 후 다시 시도해 주세요.',
            );
            setInstantReveal(true);
            setPhase('ready');
            setOutcome('watch_ad');
            setModalOpen(true);
            return;
          }
          closeModal();
          await finishUnlock();
          return;
        }
        closeModal();
        await finishUnlock();
      } finally {
        setBusy(false);
      }
    },
    [busy, closeModal, finishUnlock, onPress],
  );

  const beginUnlock = useCallback(async () => {
    if (!onPress || unlocked || modalOpen) return;

    const cached = await peekUnlockFortuneOutcome(lockId);
    if (cached) {
      setModalKey((k) => k + 1);
      setInstantReveal(true);
      setOutcome(cached);
      setPhase('ready');
      setModalOpen(true);
      return;
    }

    setModalKey((k) => k + 1);
    setInstantReveal(false);
    setPhase('loading');
    setOutcome(null);
    setModalOpen(true);

    await delay(UNLOCK_LOADING_MS);

    const next = await getOrRollUnlockFortuneOutcome(lockId, () => {
      const adChance =
        fortuneScore == null
          ? NEUTRAL_AD_OFFER_CHANCE
          : getAdOfferChanceForFortuneScore(fortuneScore);
      return resolveUnlockOutcome({ offerAd: rollAdOfferChance(adChance) });
    });
    setOutcome(next);
    setPhase('ready');
  }, [fortuneScore, lockId, modalOpen, onPress, unlocked]);

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
          <Pressable
            onPress={() => {
              void beginUnlock();
            }}
            disabled={modalOpen}
            accessibilityRole="button"
            accessibilityLabel={a11y}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: c.tint, opacity: modalOpen ? 0.55 : pressed ? 0.82 : 1 },
            ]}>
            <LockIcon color="#F3EEE6" size={22} />
          </Pressable>
        ) : null}
      </View>

      <UnlockActionModal
        key={modalKey}
        visible={modalOpen}
        phase={phase}
        outcome={outcome}
        busy={busy}
        instantReveal={instantReveal}
        onSelect={(action) => {
          void runAction(action);
        }}
        onClose={closeModal}
      />
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
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: 12,
    minHeight: 46,
  },
});
