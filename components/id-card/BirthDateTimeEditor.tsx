import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import {
  BIRTH_YEAR_MAX,
  BIRTH_YEAR_MIN,
  buildBirthDatePatch,
  clampDay,
  daysInLunarMonth,
  daysInSolarMonth,
  hasLeapMonth,
  lunarToSolar,
  pad2,
  resolveBirthParts,
  solarToLunar,
} from '@/lib/lunar';
import type { BirthCalendar, Profile } from '@/lib/types';

type PickerKind = 'year' | 'month' | 'day' | 'hour' | 'minute' | null;

type Draft = {
  calendar: BirthCalendar;
  year: number;
  month: number;
  day: number;
  leap: boolean;
  hour: number | null;
  minute: number | null;
};

type Props = {
  profile: Profile;
  tint: string;
  card: string;
  text: string;
  muted: string;
  surface: string;
  onChangeReady: (patch: Partial<Profile> | null, canSave: boolean) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function toPatch(draft: Draft): Partial<Profile> | null {
  const time =
    draft.hour != null && draft.minute != null
      ? `${pad2(draft.hour)}:${pad2(draft.minute)}`
      : null;
  return buildBirthDatePatch({
    calendar: draft.calendar,
    year: draft.year,
    month: draft.month,
    day: draft.day,
    leap: draft.leap,
    time,
  });
}

function Segment({
  label,
  value,
  onPress,
  tint,
  card,
  text,
  muted,
  selected,
  disabled,
  flex = 1,
}: {
  label: string;
  value: string;
  onPress: () => void;
  tint: string;
  card: string;
  text: string;
  muted: string;
  selected?: boolean;
  disabled?: boolean;
  flex?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.segment,
        {
          flex,
          backgroundColor: selected ? tint : card,
          borderColor: selected ? tint : 'transparent',
          opacity: disabled ? 0.38 : 1,
        },
      ]}>
      <Text style={[styles.segmentLabel, { color: selected ? '#F3EEE6' : muted }]}>{label}</Text>
      <Text style={[styles.segmentValue, { color: selected ? '#F3EEE6' : text }]}>{value}</Text>
    </Pressable>
  );
}

/**
 * 생년월일·시각을 탭해서 고르는 편집기.
 * 양력/음력 전환 시 같은 순간을 반대 달력으로 다시 채우고, 저장 패치는 부모에 넘긴다.
 */
export function BirthDateTimeEditor({
  profile,
  tint,
  card,
  text,
  muted,
  surface,
  onChangeReady,
}: Props) {
  const initial = useMemo(() => resolveBirthParts(profile), [profile]);
  const [draft, setDraft] = useState<Draft>(() => ({
    calendar: initial.calendar,
    year: initial.year,
    month: initial.month,
    day: initial.day,
    leap: initial.leap,
    hour: initial.hour,
    minute: initial.minute,
  }));
  const [picker, setPicker] = useState<PickerKind>(null);
  /** 달력·생년월일·시각이 보이는 전체 높이 — 선택 UI를 이 높이로 맞춤 */
  const [editorHeight, setEditorHeight] = useState(0);
  const lastTime = useRef<{ hour: number; minute: number }>({
    hour: initial.hour ?? 12,
    minute: initial.minute ?? 0,
  });
  const timeUnknown = draft.hour == null || draft.minute == null;

  useEffect(() => {
    if (draft.hour != null && draft.minute != null) {
      lastTime.current = { hour: draft.hour, minute: draft.minute };
    }
  }, [draft.hour, draft.minute]);

  useEffect(() => {
    onChangeReady(toPatch(draft), true);
    // 마운트 시 한 번만 — draft 변경은 apply에서 알린다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = (next: Draft) => {
    let leap = next.leap;
    if (next.calendar === 'lunar' && leap && !hasLeapMonth(next.year, next.month)) {
      leap = false;
    }
    const day = clampDay(next.year, next.month, next.day, leap, next.calendar);
    const normalized = { ...next, leap, day };
    setDraft(normalized);
    const patch = toPatch(normalized);
    onChangeReady(patch, !!patch);
  };

  const switchCalendar = (nextCal: BirthCalendar) => {
    if (nextCal === draft.calendar) return;
    if (nextCal === 'lunar') {
      const lunar = solarToLunar(draft.year, draft.month, draft.day);
      if (!lunar) return;
      apply({
        ...draft,
        calendar: 'lunar',
        year: lunar.year,
        month: lunar.month,
        day: lunar.day,
        leap: lunar.leap,
      });
    } else {
      const solar = lunarToSolar(draft.year, draft.month, draft.day, draft.leap);
      if (!solar) return;
      apply({
        ...draft,
        calendar: 'solar',
        year: solar.year,
        month: solar.month,
        day: solar.day,
        leap: false,
      });
    }
    setPicker(null);
  };

  const leapAvailable = draft.calendar === 'lunar' && hasLeapMonth(draft.year, draft.month);
  const dayMax =
    draft.calendar === 'lunar'
      ? daysInLunarMonth(draft.year, draft.month, draft.leap)
      : daysInSolarMonth(draft.year, draft.month);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = BIRTH_YEAR_MAX; y >= BIRTH_YEAR_MIN; y -= 1) list.push(y);
    return list;
  }, []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(
    () => Array.from({ length: dayMax || 30 }, (_, i) => i + 1),
    [dayMax],
  );

  const pickerTitle =
    picker === 'year'
      ? '년도 선택'
      : picker === 'month'
        ? '월 선택'
        : picker === 'day'
          ? '일 선택'
          : picker === 'hour'
            ? '시 선택'
            : picker === 'minute'
              ? '분 선택'
              : '';

  const pickerColumns =
    picker === 'year'
      ? 4
      : picker === 'month'
        ? 4
        : picker === 'day'
          ? 7
          : picker === 'hour'
            ? 6
            : picker === 'minute'
              ? 6
              : 4;

  const pickerOptions: { key: string; label: string; selected: boolean; onPick: () => void }[] =
    (() => {
      if (picker === 'year') {
        return years.map((y) => ({
          key: String(y),
          label: String(y),
          selected: y === draft.year,
          onPick: () => {
            apply({ ...draft, year: y });
            setPicker(null);
          },
        }));
      }
      if (picker === 'month') {
        return months.map((m) => ({
          key: String(m),
          label: `${m}`,
          selected: m === draft.month,
          onPick: () => {
            apply({ ...draft, month: m });
            setPicker(null);
          },
        }));
      }
      if (picker === 'day') {
        return days.map((d) => ({
          key: String(d),
          label: `${d}`,
          selected: d === draft.day,
          onPick: () => {
            apply({ ...draft, day: d });
            setPicker(null);
          },
        }));
      }
      if (picker === 'hour') {
        return HOURS.map((h) => ({
          key: String(h),
          label: pad2(h),
          selected: h === draft.hour,
          onPick: () => {
            apply({ ...draft, hour: h, minute: draft.minute ?? 0 });
            setPicker(null);
          },
        }));
      }
      if (picker === 'minute') {
        return MINUTES.map((m) => ({
          key: String(m),
          label: pad2(m),
          selected: m === draft.minute,
          onPick: () => {
            apply({ ...draft, hour: draft.hour ?? 0, minute: m });
            setPicker(null);
          },
        }));
      }
      return [];
    })();

  if (picker) {
    return (
      <View style={[styles.block, editorHeight > 0 ? { height: editorHeight } : null]}>
        <View style={styles.pickerHeader}>
          <Text style={[styles.blockLabel, { color: text }]}>{pickerTitle}</Text>
          <Pressable onPress={() => setPicker(null)}>
            <Text style={{ color: tint, fontWeight: '600' }}>뒤로</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.pickerList} nestedScrollEnabled>
          <View style={styles.pickerGrid}>
            {pickerOptions.map((opt) => (
              <View
                key={opt.key}
                style={[styles.pickerCell, { width: `${100 / pickerColumns}%` }]}>
                <Pressable
                  onPress={opt.onPick}
                  style={[
                    styles.pickerBtn,
                    {
                      backgroundColor: opt.selected ? tint : surface,
                      borderColor: opt.selected ? tint : card,
                    },
                  ]}>
                  <Text
                    style={{
                      color: opt.selected ? '#F3EEE6' : text,
                      fontSize: picker === 'year' ? 13 : 15,
                      fontWeight: opt.selected ? '700' : '600',
                      textAlign: 'center',
                    }}>
                    {opt.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const h = Math.round(e.nativeEvent.layout.height);
        if (h > 0) setEditorHeight(h);
      }}>
      <View style={styles.block}>
        <Text style={[styles.blockLabel, { color: text }]}>달력</Text>
        <View style={styles.chipRow}>
          {(
            [
              { key: 'solar', label: '양력' },
              { key: 'lunar', label: '음력' },
            ] as const
          ).map((opt) => {
            const selected = draft.calendar === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => switchCalendar(opt.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? tint : card,
                    borderColor: selected ? tint : 'transparent',
                  },
                ]}>
                <Text style={{ color: selected ? '#F3EEE6' : text, fontWeight: '600', fontSize: 13 }}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
          {draft.calendar === 'lunar' ? (
            <Pressable
              onPress={() => {
                if (!leapAvailable) return;
                apply({ ...draft, leap: !draft.leap });
              }}
              disabled={!leapAvailable}
              style={[
                styles.chip,
                {
                  backgroundColor: draft.leap ? tint : card,
                  borderColor: draft.leap ? tint : 'transparent',
                  opacity: leapAvailable ? 1 : 0.55,
                },
              ]}>
              <Text
                style={{
                  color: draft.leap ? '#F3EEE6' : muted,
                  fontWeight: '600',
                  fontSize: 13,
                }}>
                {leapAvailable ? '윤달' : '윤달 없음'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.block}>
        <Text style={[styles.blockLabel, { color: text }]}>생년월일</Text>
        <View style={styles.segmentRow}>
          <Segment
            label="년"
            value={`${draft.year}`}
            onPress={() => setPicker('year')}
            tint={tint}
            card={card}
            text={text}
            muted={muted}
            flex={1.2}
          />
          <Segment
            label="월"
            value={`${draft.month}`}
            onPress={() => setPicker('month')}
            tint={tint}
            card={card}
            text={text}
            muted={muted}
          />
          <Segment
            label="일"
            value={`${draft.day}`}
            onPress={() => setPicker('day')}
            tint={tint}
            card={card}
            text={text}
            muted={muted}
          />
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.labelRow}>
          <Text style={[styles.blockLabel, { color: text }]}>태어난 시각</Text>
          <Pressable
            onPress={() => {
              if (timeUnknown) {
                apply({
                  ...draft,
                  hour: lastTime.current.hour,
                  minute: lastTime.current.minute,
                });
              } else {
                apply({ ...draft, hour: null, minute: null });
              }
            }}
            style={styles.checkRow}
            hitSlop={8}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: timeUnknown ? tint : muted,
                  backgroundColor: timeUnknown ? tint : 'transparent',
                },
              ]}>
              {timeUnknown ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={{ color: timeUnknown ? tint : muted, fontSize: 13, fontWeight: '600' }}>
              모름
            </Text>
          </Pressable>
        </View>
        <View style={[styles.segmentRow, timeUnknown ? styles.segmentDim : null]}>
          <Segment
            label="시"
            value={draft.hour == null ? '—' : pad2(draft.hour)}
            onPress={() => setPicker('hour')}
            tint={tint}
            card={card}
            text={text}
            muted={muted}
            disabled={timeUnknown}
          />
          <Segment
            label="분"
            value={draft.minute == null ? '—' : pad2(draft.minute)}
            onPress={() => setPicker('minute')}
            tint={tint}
            card={card}
            text={text}
            muted={muted}
            disabled={timeUnknown}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  block: { gap: 10 },
  blockLabel: { fontSize: 14, fontWeight: '600' },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#F3EEE6',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segmentDim: { opacity: 0.92 },
  segment: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    gap: 2,
  },
  segmentLabel: { fontSize: 11 },
  segmentValue: { fontSize: 18, fontWeight: '700' },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerList: { flex: 1 },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  pickerCell: {
    paddingHorizontal: 3,
    marginBottom: 6,
  },
  pickerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
