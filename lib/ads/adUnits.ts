export {
  ADMOB_PUBLISHER_ID,
  ANDROID_PACKAGE,
  PRODUCTION_UNIT_NAMES,
  PRODUCTION_AD_UNITS as EMPTY_PRODUCTION_AD_UNITS,
  TEST_AD_UNITS,
} from './adUnits.example';

import { PRODUCTION_AD_UNITS as defaultProduction } from './adUnits.example';

/** 실 ID는 `adUnits.local.ts`에 두면 커밋되지 않음. 없으면 빈 문자열 → 테스트 ID 폴백. */
let production = defaultProduction;

try {
  // Optional local override (gitignored).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const local = require('./adUnits.local') as { PRODUCTION_AD_UNITS?: typeof defaultProduction };
  if (local.PRODUCTION_AD_UNITS) {
    production = local.PRODUCTION_AD_UNITS;
  }
} catch {
  // adUnits.local.ts 없음 — 테스트 ID만 사용
}

export const PRODUCTION_AD_UNITS = production;
