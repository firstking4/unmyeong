import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { PhysiognomyAvatarWizard } from '@/components/id-card/PhysiognomyAvatarWizard';
import { PhysiognomyFacePreview } from '@/components/id-card/PhysiognomyFacePreview';
import {
  ShareCardBrandFooter,
  shareCaptureHostStyle,
  waitFrames,
} from '@/components/ink/ShareCardBrandFooter';
import { Text } from '@/components/Themed';
import { KeywordBadge } from '@/components/ui/KeywordBadge';
import { PaperGrain } from '@/components/ui/PaperGrain';
import { ShareIcon } from '@/components/ui/ShareIcon';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { pagePad, paperShadow, radius, space } from '@/constants/Theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useProfile } from '@/context/ProfileContext';
import { ENTERTAINMENT_DISCLAIMER } from '@/lib/disclaimer';
import {
  buildPhysiognomyComposite,
  buildTodayPhysiognomy,
  countPhysiognomySelections,
  getPhysiognomyOption,
  listPhysiognomyCategories,
  type PhysiognomySelection,
} from '@/lib/physiognomy';
import { dateFromLocalYmd } from '@/lib/daily/pick';
import type { Gender } from '@/lib/types';
import { useLocalDateKey } from '@/lib/useLocalDateKey';

type HeroBodyProps = {
  selection: PhysiognomySelection;
  gender: Gender | undefined;
  portraitW: number;
  headline: string | null;
  keywords: string[];
  filled: number;
  text: string;
  muted: string;
  tint: string;
  card: string;
  hairline: string;
  showEmptyHint?: boolean;
};

function GwansangHeroBody({
  selection,
  gender,
  portraitW,
  headline,
  keywords,
  filled,
  text,
  muted,
  tint,
  card,
  hairline,
  showEmptyHint,
}: HeroBodyProps) {
  return (
    <>
      <View
        style={[
          styles.previewFrame,
          {
            borderColor: filled ? hairline : muted,
            backgroundColor: card,
          },
        ]}>
        <PhysiognomyFacePreview
          selection={selection}
          gender={gender}
          muted={muted}
          tint={tint}
          width={portraitW}
        />
      </View>

      {filled > 0 && headline ? (
        <Text style={[styles.cardHeadline, { color: text, fontFamily: display }]}>{headline}</Text>
      ) : null}

      {filled > 0 && keywords.length > 0 ? (
        <View style={styles.keywordRow}>
          {keywords.map((kw, i) => (
            <KeywordBadge key={`gw-${i}-${kw}`} label={kw} />
          ))}
        </View>
      ) : showEmptyHint && filled === 0 ? (
        <Text style={[styles.emptyHint, { color: muted }]}>
          얼굴형·눈·코 등 특징을 고르면 증명사진과 해설이 여기에 모입니다.
        </Text>
      ) : null}
    </>
  );
}

export default function GwansangScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { profile, updateProfile } = useProfile();
  const { width: windowW } = useWindowDimensions();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<View>(null);
  const cardW = windowW - pagePad * 2;

  const selection: PhysiognomySelection = profile.physiognomy ?? {};
  const categories = listPhysiognomyCategories();
  const filled = countPhysiognomySelections(selection);
  const dateKey = useLocalDateKey();
  const composite = useMemo(() => buildPhysiognomyComposite(selection), [selection]);
  const today = useMemo(
    () => buildTodayPhysiognomy(selection, dateFromLocalYmd(dateKey), profile.birthDate),
    [selection, dateKey, profile.birthDate],
  );
  const portraitW = Math.min(220, Math.round(windowW * 0.52));

  const applyPhysiognomy = async (next: PhysiognomySelection) => {
    await updateProfile({ physiognomy: next });
    setWizardOpen(false);
  };

  const shareCard = async () => {
    if (filled === 0) return;
    setSharing(true);
    try {
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
          dialogTitle: '관상',
        });
      } else if (Platform.OS === 'ios') {
        await Share.share({ url: uri, title: '관상' });
      } else {
        Alert.alert('공유 불가', '이 기기에서는 이미지 공유를 지원하지 않습니다.');
      }
    } catch {
      // 공유 시트를 닫으면 여기로 온다.
    } finally {
      setSharing(false);
    }
  };

  const heroProps: HeroBodyProps = {
    selection,
    gender: profile.gender,
    portraitW,
    headline: composite.headline,
    keywords: composite.keywords ?? [],
    filled,
    text: c.text,
    muted: c.muted,
    tint: c.tint,
    card: c.card,
    hairline: c.hairline,
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <PaperGrain color={c.grain} />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.content}>
        <Text style={[styles.lead, { color: c.muted }]}>
          사진 분석이 아니라, 본인이 고른 얼굴 특징을 바탕으로 참고용 해설을 보여 줍니다.
        </Text>

        <View style={[styles.hero, paperShadow, { backgroundColor: c.surface }]}>
          {filled > 0 ? (
            <Pressable
              onPress={shareCard}
              disabled={sharing}
              style={({ pressed }) => [
                styles.shareBtn,
                { opacity: pressed || sharing ? 0.55 : 1 },
              ]}
              accessibilityLabel="관상 카드 공유"
              hitSlop={8}>
              <ShareIcon color={c.muted} size={20} />
            </Pressable>
          ) : null}

          <GwansangHeroBody {...heroProps} showEmptyHint />
        </View>

        {sharing && filled > 0 ? (
          <View style={shareCaptureHostStyle} pointerEvents="none">
            <View
              ref={shareRef}
              collapsable={false}
              style={[
                styles.hero,
                paperShadow,
                { width: cardW, backgroundColor: c.surface, marginBottom: 0 },
              ]}>
              <GwansangHeroBody {...heroProps} />
              <ShareCardBrandFooter tint={c.tint} text={c.text} hairline={c.hairline} />
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={() => setWizardOpen(true)}
          style={({ pressed }) => [
            styles.editBtn,
            { backgroundColor: c.tint, opacity: pressed ? 0.85 : 1 },
          ]}>
          <Text style={styles.editBtnText}>{filled > 0 ? '특징 수정' : '얼굴 특징 고르기'}</Text>
        </Pressable>

        {filled > 0 ? (
          <>
            <View style={[styles.todayResult, { borderTopColor: c.card }]}>
              <Text style={[styles.resultEyebrow, { color: c.tint }]}>오늘의 관상</Text>
              <Text style={[styles.todayDate, { color: c.muted }]}>{today.dateLabel}</Text>
              <Text style={[styles.todayHeadline, { color: c.text, fontFamily: display }]}>
                {today.headline}
              </Text>
              <View style={styles.todayKeywords}>
                {today.keywords.map((keyword) => (
                  <KeywordBadge key={`today-${keyword}`} label={keyword} />
                ))}
              </View>
              <Text style={[styles.resultSummary, { color: c.muted }]}>{today.summary}</Text>
              {today.hints.map((hint) => (
                <View key={hint.label} style={styles.hintBlock}>
                  <Text style={[styles.hintLabel, { color: c.text }]}>{hint.label}</Text>
                  <Text style={[styles.hintText, { color: c.muted }]}>{hint.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pickList}>
              {categories.map((cat) => {
                const option = getPhysiognomyOption(selection[cat.id]);
                return (
                  <View key={cat.id} style={[styles.pickRow, { borderBottomColor: c.card }]}>
                    <Text style={[styles.pickCat, { color: c.muted }]}>{cat.label}</Text>
                    <Text style={[styles.pickLabel, { color: option ? c.text : c.muted }]}>
                      {option?.label ?? '—'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={[styles.result, { borderTopColor: c.card }]}>
              <Text style={[styles.resultEyebrow, { color: c.tint }]}>해설</Text>
              <Text style={[styles.resultSummary, { color: c.muted }]}>{composite.summary}</Text>

              <View style={styles.hintBlock}>
                <Text style={[styles.hintLabel, { color: c.text }]}>관계</Text>
                <Text style={[styles.hintText, { color: c.muted }]}>{composite.hints.love}</Text>
              </View>
              <View style={styles.hintBlock}>
                <Text style={[styles.hintLabel, { color: c.text }]}>일·재능</Text>
                <Text style={[styles.hintText, { color: c.muted }]}>{composite.hints.work}</Text>
              </View>
              <View style={styles.hintBlock}>
                <Text style={[styles.hintLabel, { color: c.text }]}>성장</Text>
                <Text style={[styles.hintText, { color: c.muted }]}>{composite.hints.growth}</Text>
              </View>

              {composite.detailLines.length > 0 && (
                <View style={[styles.detailList, { borderTopColor: c.card }]}>
                  {composite.detailLines.map((line) => (
                    <View
                      key={line.category}
                      style={[styles.detailRow, { borderBottomColor: c.card }]}>
                      <Text style={[styles.detailCat, { color: c.tint }]}>{line.category}</Text>
                      <Text style={[styles.detailLabel, { color: c.text }]}>{line.label}</Text>
                      <Text style={[styles.detailBlurb, { color: c.muted }]}>{line.blurb}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}

        <Text style={[styles.disclaimer, { color: c.muted }]}>{ENTERTAINMENT_DISCLAIMER}</Text>
      </ScrollView>

      <PhysiognomyAvatarWizard
        visible={wizardOpen}
        initialSelection={selection}
        gender={profile.gender}
        onApply={applyPhysiognomy}
        onClose={() => setWizardOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: pagePad,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  lead: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: radius.lg,
    marginBottom: 12,
    position: 'relative',
  },
  shareBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  cardHeadline: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  previewFrame: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyHint: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  editBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 18,
  },
  editBtnText: {
    color: '#F3EEE6',
    fontWeight: '700',
    fontSize: 14,
  },
  todayResult: {
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  todayDate: {
    fontSize: 12,
  },
  todayHeadline: {
    fontSize: 20,
    lineHeight: 28,
  },
  todayKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  pickList: {
    marginBottom: 8,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickCat: {
    width: 48,
    fontSize: 13,
    fontWeight: '600',
  },
  pickLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  result: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resultEyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 8,
  },
  resultSummary: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  hintBlock: {
    marginBottom: 12,
    gap: 4,
  },
  hintLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailList: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  detailCat: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  detailBlurb: {
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimer: {
    marginTop: 28,
    fontSize: 12,
    lineHeight: 18,
  },
});
