import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { UnlockActionModal, type UnlockModalPhase } from '@/components/ui/UnlockActionModal';
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
import {
  resolveUnlockOutcome,
  type UnlockActionId,
  type UnlockFortuneCopyVariant,
} from '@/lib/unlockActions';

const UNLOCK_LOADING_MS = 2000;
/** RN Modal이 떠 있으면 AdMob rewarded가 안 뜨는 경우가 많아, 닫힌 뒤 잠깐 기다림. */
const AD_AFTER_MODAL_MS = 360;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

type UnlockCallback = () => void | Promise<void>;

type Options = {
  /** untilMidnight: 오늘 카드. once: 한 점 타로(한 번 보면 해당 lockId 고정만 지움). */
  copyVariant?: UnlockFortuneCopyVariant;
};

/**
 * 자물쇠 탭 → 광고운 팝업 → 즉시확인 / 광고보고확인.
 * 당일·lockId별 광고운 결과는 한 번 정해지면 고정(재시도로 바꾸지 않음).
 */
export function useUnlockFortuneFlow(options: Options = {}): {
  beginUnlock: (lockId: string, onUnlocked: UnlockCallback) => Promise<void>;
  modal: ReactNode;
  /** 모달·광고·해금 진행 중이면 true (다른 잠금을 열지 않음). */
  modalOpen: boolean;
} {
  const copyVariant = options.copyVariant ?? 'untilMidnight';
  const { showReviewPrompt } = useReviewPrompt();
  const { profile, fortuneReady } = useProfile();
  const dateKey = useLocalDateKey();
  const fortuneScore = useMemo(() => {
    if (!fortuneReady) return null;
    return buildIntegratedFortune(profile).score;
  }, [dateKey, fortuneReady, profile]);

  const onUnlockedRef = useRef<UnlockCallback | null>(null);
  const sessionRef = useRef(0);
  /** 모달이 닫혀 있어도 광고·해금 중이면 다른 잠금을 열지 않음 */
  const inFlightRef = useRef(false);

  const [visible, setVisible] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [phase, setPhase] = useState<UnlockModalPhase>('loading');
  const [outcome, setOutcome] = useState<UnlockActionId | null>(null);
  const [busy, setBusy] = useState(false);
  const [instantReveal, setInstantReveal] = useState(false);

  /** 닫을 때는 visible만 false — 내용 리셋하면 fade-out 중 로딩이 비침 */
  const closeModal = useCallback(() => {
    sessionRef.current += 1;
    inFlightRef.current = false;
    setVisible(false);
    setBusy(false);
  }, []);

  const finishUnlock = useCallback(async () => {
    const onUnlocked = onUnlockedRef.current;
    if (!onUnlocked) {
      inFlightRef.current = false;
      return;
    }

    try {
      const state = await loadGuideQuotaState();
      const { next, shouldPromptReview } = recordUnlock(state);
      await saveGuideQuotaState(next);
      await onUnlocked();
      if (shouldPromptReview) {
        showReviewPrompt();
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [showReviewPrompt]);

  const runAction = useCallback(
    async (action: UnlockActionId) => {
      if (!onUnlockedRef.current || busy) return;
      setBusy(true);
      try {
        if (action === 'watch_ad') {
          setVisible(false);
          await delay(AD_AFTER_MODAL_MS);
          const result = await showRewarded();
          if (result !== 'earned') {
            Alert.alert(
              '광고를 불러오지 못했어요',
              result === 'dismissed'
                ? copyVariant === 'once'
                  ? '광고를 끝까지 보시면 한 점을 볼 수 있어요.'
                  : '광고를 끝까지 보시면 자세한 풀이가 열려요.'
                : '잠시 후 다시 시도해 주세요.',
            );
            setInstantReveal(true);
            setPhase('ready');
            setOutcome('watch_ad');
            setVisible(true);
            return;
          }
          setVisible(false);
          await finishUnlock();
          return;
        }
        setVisible(false);
        await finishUnlock();
      } finally {
        setBusy(false);
      }
    },
    [busy, copyVariant, finishUnlock],
  );

  const beginUnlock = useCallback(
    async (lockId: string, onUnlocked: UnlockCallback) => {
      if (inFlightRef.current || visible || busy) return;
      inFlightRef.current = true;

      const session = ++sessionRef.current;
      onUnlockedRef.current = onUnlocked;

      const cached = await peekUnlockFortuneOutcome(lockId);
      if (session !== sessionRef.current) return;
      if (cached) {
        setModalKey((k) => k + 1);
        setInstantReveal(true);
        setOutcome(cached);
        setPhase('ready');
        setVisible(true);
        return;
      }

      setModalKey((k) => k + 1);
      setInstantReveal(false);
      setPhase('loading');
      setOutcome(null);
      setVisible(true);

      await delay(UNLOCK_LOADING_MS);
      if (session !== sessionRef.current) return;

      const next = await getOrRollUnlockFortuneOutcome(lockId, () => {
        const adChance =
          fortuneScore == null
            ? NEUTRAL_AD_OFFER_CHANCE
            : getAdOfferChanceForFortuneScore(fortuneScore);
        return resolveUnlockOutcome({ offerAd: rollAdOfferChance(adChance) });
      });
      if (session !== sessionRef.current) return;
      setOutcome(next);
      setPhase('ready');
    },
    [busy, fortuneScore, visible],
  );

  const modal = (
    <UnlockActionModal
      key={modalKey}
      visible={visible}
      phase={phase}
      outcome={outcome}
      busy={busy}
      instantReveal={instantReveal}
      copyVariant={copyVariant}
      onSelect={(action) => {
        void runAction(action);
      }}
      onClose={closeModal}
    />
  );

  return { beginUnlock, modal, modalOpen: visible || busy };
}
