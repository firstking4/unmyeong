import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { DojangSeal } from '@/components/ink/DojangSeal';
import {
  ShareCardBrandFooter,
  shareCaptureHostStyle,
  waitFrames,
} from '@/components/ink/ShareCardBrandFooter';
import { Text } from '@/components/Themed';
import { ShareIcon } from '@/components/ui/ShareIcon';
import Colors from '@/constants/Colors';
import { paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import { type IDCardFieldKey } from '@/lib/idCardFields';
import { birthCalendarLabel, formatBirthDateDisplay } from '@/lib/lunar';
import { hasPhysiognomyFace } from '@/lib/physiognomyFaceParams';
import { formatSajuHourLabel } from '@/lib/saju';
import type { PhysiognomySelection, Profile } from '@/lib/types';

import { FieldEditorModal } from './FieldEditorModal';
import { PhysiognomyAvatarWizard } from './PhysiognomyAvatarWizard';
import { PORTRAIT_H, PORTRAIT_W, PhysiognomyFacePreview } from './PhysiognomyFacePreview';
import { ProfileWelcomeModal } from './ProfileWelcomeModal';

/** 빈 프로필 온보딩 — 카드에 보이는 입력 순서. */
const ONBOARDING_FIELDS: IDCardFieldKey[] = ['name', 'birthDate', 'gender', 'mbti', 'bloodType'];

function isEmptyIdProfile(profile: Profile) {
  return !(
    profile.name?.trim() ||
    profile.birthDate ||
    profile.gender ||
    profile.bloodType ||
    profile.mbti ||
    hasPhysiognomyFace(profile.physiognomy ?? {})
  );
}

/** 지도 스크롤 좌우 패딩(space.md) — 카드 가용 폭 계산에 맞춤. */
const PAGE_PAD = space.md;
const CARD_H_PAD = space.sm;
const BODY_GAP = 12;
/** 공유 버튼과 겹치지 않게 — 이름(첫 행)에만 적용. */
const NAME_RIGHT_PAD = 28;
/** 라벨+값(생년월일·시간 등)이 말줄임 없이 들어가도록. */
const FIELDS_MIN_W = 140;
const PHOTO_MIN_W = 84;
const PHOTO_MAX_W = Math.round(PORTRAIT_W * 1.18);

function genderLabel(profile: Profile) {
  if (profile.gender === 'male') return '남성';
  if (profile.gender === 'female') return '여성';
  return null;
}

function FieldRow({
  label,
  value,
  onPress,
  text,
  muted,
  padRight,
}: {
  label: string;
  value: string | null;
  onPress?: () => void;
  text: string;
  muted: string;
  padRight?: number;
}) {
  const content = (
    <>
      <Text style={[styles.fieldLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: value ? text : muted }]}>{value ?? '—'}</Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.fieldRow, { paddingRight: padRight }]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fieldRow,
        { opacity: pressed ? 0.65 : 1, paddingRight: padRight },
      ]}>
      {content}
    </Pressable>
  );
}

type CardBodyProps = {
  photoW: number;
  photoH: number;
  physiognomy: PhysiognomySelection;
  gender: Profile['gender'];
  rows: { label: string; value: string | null; field: IDCardFieldKey }[];
  text: string;
  muted: string;
  tint: string;
  cardBg: string;
  hairline: string;
  interactive?: boolean;
  hasFace: boolean;
  onOpenPhysiognomy?: () => void;
  onFieldPress?: (field: IDCardFieldKey) => void;
};

function IdCardBody({
  photoW,
  photoH,
  physiognomy,
  gender,
  rows,
  text,
  muted,
  tint,
  cardBg,
  hairline,
  interactive = true,
  hasFace,
  onOpenPhysiognomy,
  onFieldPress,
}: CardBodyProps) {
  const photo = (
    <View
      style={[
        styles.photoFrame,
        {
          width: photoW,
          height: photoH,
          backgroundColor: cardBg,
          borderColor: hairline,
        },
      ]}>
      <PhysiognomyFacePreview
        selection={physiognomy}
        gender={gender}
        muted={muted}
        tint={tint}
        width={photoW}
      />
    </View>
  );

  return (
    <View style={styles.body}>
      <View style={[styles.photoCol, { width: photoW }]}>
        {interactive && onOpenPhysiognomy ? (
          <Pressable
            onPress={onOpenPhysiognomy}
            accessibilityRole="button"
            accessibilityLabel={hasFace ? '관상' : '관상 등록'}
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            {photo}
          </Pressable>
        ) : (
          photo
        )}
        <View style={styles.seal} pointerEvents="none">
          <DojangSeal size={28} color={tint} rotate={-8} />
        </View>
      </View>

      <View style={styles.fieldsCol}>
        {rows.map((row, index) => (
          <FieldRow
            key={row.label}
            label={row.label}
            value={row.value}
            onPress={interactive && onFieldPress ? () => onFieldPress(row.field) : undefined}
            text={text}
            muted={muted}
            padRight={interactive && index === 0 ? NAME_RIGHT_PAD : undefined}
          />
        ))}
      </View>
    </View>
  );
}

export function IdentityCard() {
  const router = useRouter();
  const c = Colors[useColorScheme() ?? 'light'];
  const { width: windowW } = useWindowDimensions();
  const { profile, updateProfile, loaded } = useProfile();
  const [activeField, setActiveField] = useState<IDCardFieldKey | null>(null);
  const [onboarding, setOnboarding] = useState(false);
  const [wizardAfterOnboarding, setWizardAfterOnboarding] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<View>(null);
  /** 이번 앱 세션에서 안내를 이미 띄웠는지 — 취소 후 반복 노출 방지. */
  const welcomeOffered = useRef(false);
  const physiognomy = profile.physiognomy ?? {};
  const hasFace = hasPhysiognomyFace(physiognomy);
  const emptyProfile = isEmptyIdProfile(profile);
  const cardW = windowW - PAGE_PAD * 2;

  useEffect(() => {
    if (!loaded || welcomeOffered.current) return;
    if (!emptyProfile) return;
    welcomeOffered.current = true;
    setWelcomeOpen(true);
  }, [loaded, emptyProfile]);

  /** 좁은 화면에서는 관상 사진을 줄여 오른쪽 프로필 최소 폭을 지킨다. */
  const photoW = useMemo(() => {
    const inner = windowW - PAGE_PAD * 2 - CARD_H_PAD * 2 - BODY_GAP;
    return Math.max(PHOTO_MIN_W, Math.min(PHOTO_MAX_W, inner - FIELDS_MIN_W));
  }, [windowW]);
  const photoH = Math.round((photoW * PORTRAIT_H) / PORTRAIT_W);

  const rows: { label: string; value: string | null; field: IDCardFieldKey }[] = [
    { label: '이름', value: profile.name?.trim() || null, field: 'name' },
    { label: '생년월일', value: formatBirthDateDisplay(profile), field: 'birthDate' },
    {
      label: '양력/음력',
      value: profile.birthDate
        ? birthCalendarLabel(profile.birthCalendar ?? 'solar')
        : null,
      field: 'birthDate',
    },
    { label: '태어난 시간', value: formatSajuHourLabel(profile.birthTime), field: 'birthDate' },
    { label: '성별', value: genderLabel(profile), field: 'gender' },
    { label: 'MBTI', value: profile.mbti ?? null, field: 'mbti' },
    {
      label: '혈액형',
      value: profile.bloodType ? `${profile.bloodType}형` : null,
      field: 'bloodType',
    },
  ];

  const beginOnboarding = (openWizardAtEnd: boolean) => {
    setWelcomeOpen(false);
    setOnboarding(true);
    setWizardAfterOnboarding(openWizardAtEnd);
    setActiveField(ONBOARDING_FIELDS[0]);
  };

  const handleWelcomeStart = () => {
    beginOnboarding(false);
  };

  const handleWelcomeSkip = () => {
    setWelcomeOpen(false);
  };

  const handleFieldPress = (field: IDCardFieldKey) => {
    if (emptyProfile) {
      beginOnboarding(false);
      return;
    }
    setActiveField(field);
  };

  const openPhysiognomy = () => {
    if (hasFace) {
      router.push('/gwansang');
      return;
    }
    if (emptyProfile) {
      beginOnboarding(true);
      return;
    }
    setWizardOpen(true);
  };

  const handleFieldClose = () => {
    setActiveField(null);
    setOnboarding(false);
    setWizardAfterOnboarding(false);
  };

  const handleFieldSaved = (field: IDCardFieldKey) => {
    if (!onboarding) {
      setActiveField(null);
      return;
    }
    const index = ONBOARDING_FIELDS.indexOf(field);
    const next = ONBOARDING_FIELDS[index + 1];
    if (next) {
      setActiveField(next);
      return;
    }
    setActiveField(null);
    setOnboarding(false);
    if (wizardAfterOnboarding) {
      setWizardAfterOnboarding(false);
      setWizardOpen(true);
    }
  };

  const onboardingConfirmLabel =
    onboarding && activeField
      ? activeField === ONBOARDING_FIELDS[ONBOARDING_FIELDS.length - 1]
        ? wizardAfterOnboarding
          ? '다음'
          : '완료'
        : '다음'
      : '저장';

  const applyPhysiognomy = async (next: PhysiognomySelection) => {
    await updateProfile({ physiognomy: next });
    setWizardOpen(false);
  };

  const shareCard = async () => {
    setSharing(true);
    try {
      // 화면 밖 공유용 뷰가 그려진 뒤 캡처 (화면 카드 UI는 그대로)
      await waitFrames(3);
      if (!shareRef.current) return;
      const uri = await captureRef(shareRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '사주 카드',
        });
      } else if (Platform.OS === 'ios') {
        await Share.share({ url: uri, title: '사주 카드' });
      } else {
        Alert.alert('공유 불가', '이 기기에서는 이미지 공유를 지원하지 않습니다.');
      }
    } catch {
      // 공유 시트 취소
    } finally {
      setSharing(false);
    }
  };

  const bodyProps: CardBodyProps = {
    photoW,
    photoH,
    physiognomy,
    gender: profile.gender,
    rows,
    text: c.text,
    muted: c.muted,
    tint: c.tint,
    cardBg: c.card,
    hairline: c.hairline,
    hasFace,
  };

  return (
    <>
      <View style={[styles.card, paperShadow, { backgroundColor: c.surface }]}>
        <Pressable
          onPress={shareCard}
          disabled={sharing}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="사주 카드 공유"
          style={({ pressed }) => [
            styles.shareBtn,
            { opacity: pressed || sharing ? 0.55 : 1 },
          ]}>
          <ShareIcon color={c.muted} size={18} />
        </Pressable>

        <IdCardBody
          {...bodyProps}
          interactive
          onOpenPhysiognomy={openPhysiognomy}
          onFieldPress={handleFieldPress}
        />
      </View>

      {sharing ? (
        <View style={shareCaptureHostStyle} pointerEvents="none">
          <View
            ref={shareRef}
            collapsable={false}
            style={[
              styles.card,
              paperShadow,
              { width: cardW, backgroundColor: c.surface },
            ]}>
            <IdCardBody {...bodyProps} interactive={false} />
            <ShareCardBrandFooter tint={c.tint} text={c.text} hairline={c.hairline} />
          </View>
        </View>
      ) : null}

      <ProfileWelcomeModal
        visible={welcomeOpen}
        onStart={handleWelcomeStart}
        onSkip={handleWelcomeSkip}
      />
      <FieldEditorModal
        field={activeField}
        onClose={handleFieldClose}
        onSaved={handleFieldSaved}
        confirmLabel={onboardingConfirmLabel}
      />
      <PhysiognomyAvatarWizard
        visible={wizardOpen}
        initialSelection={physiognomy}
        gender={profile.gender}
        onApply={applyPhysiognomy}
        onClose={() => setWizardOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    position: 'relative',
  },
  shareBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 3,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: CARD_H_PAD,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: BODY_GAP,
  },
  photoCol: {
    flexShrink: 0,
    paddingBottom: 10,
  },
  photoFrame: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  seal: {
    position: 'absolute',
    left: -4,
    bottom: 2,
    zIndex: 2,
  },
  fieldsCol: {
    flex: 1,
    minWidth: FIELDS_MIN_W,
    justifyContent: 'center',
    gap: 7,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    width: 68,
    fontSize: 12,
    flexShrink: 0,
  },
  fieldValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});
