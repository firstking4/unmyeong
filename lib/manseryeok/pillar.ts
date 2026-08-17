import {
  EARTHLY_BRANCHES,
  EARTHLY_BRANCHES_HANJA,
  HEAVENLY_STEMS,
  HEAVENLY_STEMS_HANJA,
  type EarthlyBranch,
  type HeavenlyStem,
  type Pillar,
} from 'manseryeok';

import type { ManseryeokPillar } from './types';

export function toPillar(pillar: Pillar, korean: string, hanja: string): ManseryeokPillar {
  return {
    stem: pillar.heavenlyStem,
    branch: pillar.earthlyBranch,
    korean,
    hanja,
  };
}

export function pillarHanja(stem: HeavenlyStem, branch: EarthlyBranch): string {
  const si = HEAVENLY_STEMS.indexOf(stem);
  const bi = EARTHLY_BRANCHES.indexOf(branch);
  if (si < 0 || bi < 0) return `${stem}${branch}`;
  return `${HEAVENLY_STEMS_HANJA[si]}${EARTHLY_BRANCHES_HANJA[bi]}`;
}

export function pillarFromParts(stem: HeavenlyStem, branch: EarthlyBranch, korean: string): ManseryeokPillar {
  return {
    stem,
    branch,
    korean,
    hanja: pillarHanja(stem, branch),
  };
}
