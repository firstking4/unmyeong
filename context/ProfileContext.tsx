import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { logProfileComplete } from '@/lib/firebase/analytics';
import { appStorage } from '@/lib/storage';
import { parseYmd, solarToLunar, formatYmd } from '@/lib/lunar';
import type { Profile } from '@/lib/types';

const STORAGE_KEY = '@unmyeong/profile';
const PROFILE_COMPLETE_ANALYTICS_KEY = '@unmyeong/analytics/profile-complete';

/** 입·눈썹·코 평탄 옵션 → 2×2 합성 id */
const PHYSIOGNOMY_OPTION_MIGRATE: Record<string, string> = {
  mouth_large: 'mouth_large_full',
  mouth_small: 'mouth_small_full',
  mouth_full: 'mouth_large_full',
  mouth_thin: 'mouth_large_thin',
  brow_straight: 'brow_straight_thick',
  brow_arched: 'brow_arched_thick',
  brow_thick: 'brow_straight_thick',
  brow_thin: 'brow_straight_thin',
  nose_high: 'nose_high_wide',
  nose_low: 'nose_low_wide',
  nose_wide: 'nose_high_wide',
  nose_narrow: 'nose_high_narrow',
};

function migratePhysiognomySelection(
  selection: Profile['physiognomy'],
): Profile['physiognomy'] | undefined {
  if (!selection || typeof selection !== 'object') return selection;
  const next: NonNullable<Profile['physiognomy']> = { ...selection };
  for (const [category, optionId] of Object.entries(next)) {
    if (!optionId) continue;
    const mapped = PHYSIOGNOMY_OPTION_MIGRATE[optionId];
    if (mapped) next[category] = mapped;
  }
  return next;
}

/** 구버전 characterVariant 등 제거된 필드 정리 + 양력만 있는 프로필에 음력 보강 */
function sanitizeProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== 'object') return {};
  const {
    characterVariant: _legacy,
    fourAxis: _fourAxis,
    bigFive: _bigFive,
    ...rest
  } = raw as Profile & {
    characterVariant?: unknown;
    fourAxis?: unknown;
    bigFive?: unknown;
  };
  const profile: Profile = { ...rest };
  if (profile.physiognomy) {
    profile.physiognomy = migratePhysiognomySelection(profile.physiognomy);
  }
  if (profile.birthDate && !profile.birthLunarDate) {
    const solar = parseYmd(profile.birthDate);
    if (solar) {
      const lunar = solarToLunar(solar.year, solar.month, solar.day);
      if (lunar) {
        profile.birthLunarDate = formatYmd(lunar.year, lunar.month, lunar.day);
        profile.birthLeapMonth = lunar.leap;
      }
    }
  }
  if (profile.birthDate && !profile.birthCalendar) {
    profile.birthCalendar = 'solar';
  }
  return profile;
}

type ProfileContextValue = {
  profile: Profile;
  loaded: boolean;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  /** 백업 복원 등 — 전체를 교체한다. */
  replaceProfile: (next: Profile) => Promise<void>;
  clearProfile: () => Promise<void>;
  hasProfile: boolean;
  fortuneReady: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function hasMeaningfulData(profile: Profile) {
  return Boolean(
    profile.name || profile.birthDate || profile.bloodType || profile.mbti,
  );
}

export function isFortuneReady(profile: Profile) {
  return Boolean(profile.name?.trim() && profile.birthDate?.trim());
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await appStorage.getItem(STORAGE_KEY);
        if (alive && raw) setProfile(sanitizeProfile(JSON.parse(raw)));
      } catch {
        // ignore corrupt / unavailable storage
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    let wasFortuneReady = false;
    let next: Profile = {};
    setProfile((prev) => {
      wasFortuneReady = isFortuneReady(prev);
      next = { ...prev, ...patch };
      // undefined로 넘긴 선택 필드는 지운다(태어난 시각 모름 등).
      (Object.keys(patch) as (keyof Profile)[]).forEach((key) => {
        if (patch[key] === undefined) delete next[key];
      });
      return next;
    });
    await appStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (!wasFortuneReady && isFortuneReady(next)) {
      const alreadyLogged = await appStorage.getItem(PROFILE_COMPLETE_ANALYTICS_KEY);
      if (!alreadyLogged) {
        await appStorage.setItem(PROFILE_COMPLETE_ANALYTICS_KEY, '1');
        void logProfileComplete();
      }
    }
  }, []);

  const replaceProfile = useCallback(async (nextRaw: Profile) => {
    const next = sanitizeProfile(nextRaw);
    setProfile(next);
    if (hasMeaningfulData(next)) {
      await appStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      await appStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearProfile = useCallback(async () => {
    setProfile({});
    await appStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      loaded,
      updateProfile,
      replaceProfile,
      clearProfile,
      hasProfile: hasMeaningfulData(profile),
      fortuneReady: isFortuneReady(profile),
    }),
    [profile, loaded, updateProfile, replaceProfile, clearProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
