import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/Themed';
import { ResetIcon } from '@/components/ui/ResetIcon';
import Colors from '@/constants/Colors';
import { display } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';
import { hasPhysiognomyFace } from '@/lib/physiognomyFaceParams';
import {
  getPhysiognomyOption,
  listPhysiognomyCategories,
  listPhysiognomyOptions,
  physiognomyFeatureCue,
  type PhysiognomySelection,
} from '@/lib/physiognomy';
import type { Gender } from '@/lib/types';

import { OPTION_TILE_W, PhysiognomyOptionTile } from './PhysiognomyOptionTile';
import { PORTRAIT_W, PhysiognomyFacePreview } from './PhysiognomyFacePreview';

type Props = {
  visible: boolean;
  initialSelection: PhysiognomySelection;
  gender?: Gender;
  onApply: (selection: PhysiognomySelection) => void;
  onClose: () => void;
};

const BACKDROP_PAD = 16;
const SHEET_PAD = 20;
const PREVIEW_PAD = 14;
const PREVIEW_GAP = 14;

/** 부위 이름·값이 말줄임 없이 한 줄로 들어가는 최소 폭. */
const META_MIN_W = 120;
/** 상단(얼굴형) 행만 — 시트 우측과 겹치지 않게. */
const META_TOP_RIGHT_PAD = 28;
const PREVIEW_MIN_W = 84;
const PREVIEW_MAX_W = Math.round(PORTRAIT_W * 1.4);

export function PhysiognomyAvatarWizard({
  visible,
  initialSelection,
  gender,
  onApply,
  onClose,
}: Props) {
  const c = Colors[useColorScheme() ?? 'light'];
  const { width: windowW } = useWindowDimensions();
  const categories = useMemo(() => listPhysiognomyCategories(), []);
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? '');
  const [selection, setSelection] = useState<PhysiognomySelection>(initialSelection);

  useEffect(() => {
    if (!visible) return;
    setSelection(initialSelection);
    const firstEmpty = categories.find((cat) => !initialSelection[cat.id]);
    setActiveCategoryId(firstEmpty?.id ?? categories[0]?.id ?? '');
  }, [visible, initialSelection, categories]);

  const current = categories.find((cat) => cat.id === activeCategoryId) ?? categories[0];
  const options = current ? listPhysiognomyOptions(current.id) : [];
  const selectedId = current ? selection[current.id] : undefined;
  const hasPreview = useMemo(() => hasPhysiognomyFace(selection), [selection]);
  /** 좁은 화면에서는 증명사진을 줄여 부위 값이 말줄임되지 않게 한다. */
  const previewW = useMemo(() => {
    const inner = windowW - (BACKDROP_PAD + SHEET_PAD + PREVIEW_PAD) * 2 - PREVIEW_GAP;
    return Math.max(PREVIEW_MIN_W, Math.min(PREVIEW_MAX_W, inner - META_MIN_W));
  }, [windowW]);

  const pickOption = (optionId: string) => {
    if (!current) return;
    setSelection((prev) => ({ ...prev, [current.id]: optionId }));
  };

  const resetSelection = () => {
    setSelection({});
    setActiveCategoryId(categories[0]?.id ?? '');
  };

  if (!current) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
        <View style={[styles.sheet, { backgroundColor: c.background }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: c.text, fontFamily: display }]}>관상 프로필</Text>
            <Pressable
              onPress={resetSelection}
              hitSlop={8}
              accessibilityLabel="선택 초기화"
              accessibilityRole="button"
              style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, padding: 2 })}>
              <ResetIcon color={c.muted} />
            </Pressable>
          </View>
          <Text style={[styles.sub, { color: c.muted }]}>
            부위를 골라 특징을 맞추면 증명사진에 바로 반영됩니다.
          </Text>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={[styles.previewRow, { backgroundColor: c.card }]}>
              <View
                style={[
                  styles.previewFrame,
                  {
                    borderColor: hasPreview ? c.tint : c.muted,
                    backgroundColor: c.background,
                  },
                ]}>
                <PhysiognomyFacePreview
                  selection={selection}
                  gender={gender}
                  muted={c.muted}
                  tint={c.tint}
                  width={previewW}
                />
              </View>
              <View style={styles.previewMeta}>
                {categories.map((cat, index) => {
                  const option = getPhysiognomyOption(selection[cat.id]);
                  const active = cat.id === current.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveCategoryId(cat.id)}
                      style={[
                        styles.metaRow,
                        index === 0 ? { paddingRight: META_TOP_RIGHT_PAD } : null,
                      ]}
                      hitSlop={4}>
                      <Text style={[styles.metaLabel, { color: active ? c.tint : c.muted }]}>
                        {cat.label}
                      </Text>
                      <Text style={[styles.metaValue, { color: option ? c.text : c.muted }]}>
                        {option?.label ?? '—'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
              style={styles.tabScroll}>
              {categories.map((cat) => {
                const active = cat.id === current.id;
                const picked = Boolean(selection[cat.id]);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setActiveCategoryId(cat.id)}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: active ? c.tint : c.card,
                        borderColor: active ? c.tint : picked ? c.hairline : 'transparent',
                      },
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: active ? '#F3EEE6' : c.text,
                        fontWeight: active ? '700' : '600',
                        fontSize: 13,
                      }}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionPrompt, { color: c.muted }]}>
              {physiognomyFeatureCue(current.prompt, selectedId)}
            </Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.tileRow}
              style={styles.optionScroll}>
              {options.map((opt) => (
                <PhysiognomyOptionTile
                  key={opt.id}
                  label={opt.label}
                  selected={selectedId === opt.id}
                  onPress={() => pickOption(opt.id)}
                  selection={{ ...selection, [current.id]: opt.id }}
                  gender={gender}
                  tint={c.tint}
                  text={c.text}
                  muted={c.muted}
                  hairline={c.hairline}
                  card={c.card}
                  width={OPTION_TILE_W}
                />
              ))}
            </ScrollView>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.secondaryBtn, { backgroundColor: c.card }]}>
              <Text style={{ color: c.text, fontWeight: '600' }}>닫기</Text>
            </Pressable>
            <Pressable
              onPress={() => onApply(selection)}
              style={[styles.primaryBtn, { backgroundColor: c.tint }]}>
              <Text style={{ color: '#F3EEE6', fontWeight: '700' }}>프로필 적용</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 23, 20, 0.45)',
    justifyContent: 'center',
    padding: BACKDROP_PAD,
  },
  sheet: {
    zIndex: 1,
    borderRadius: 22,
    padding: SHEET_PAD,
    maxHeight: '92%',
    gap: 12,
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  bodyContent: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    flexShrink: 1,
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: PREVIEW_GAP,
    padding: PREVIEW_PAD,
    borderRadius: 16,
  },
  previewFrame: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  previewMeta: {
    flex: 1,
    minWidth: META_MIN_W,
    gap: 2,
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 20,
  },
  metaLabel: {
    width: 46,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tab: {
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
  },
  sectionPrompt: {
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  optionScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 12,
    paddingBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtn: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
});
