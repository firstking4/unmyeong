import type { PhysiognomySelection } from '@/lib/types';

/** SVG 얼굴 미리보기용 파라미터 (0.7~1.3 근처 스케일) */
export type FaceVisualParams = {
  faceWidth: number;
  faceHeight: number;
  jawRoundness: number;
  chinLength: number;
  foreheadHeight: number;
  eyeSize: number;
  eyeTilt: number;
  browThickness: number;
  browArch: number;
  noseLength: number;
  noseWidth: number;
  mouthWidth: number;
  lipThickness: number;
  hasDoubleEyelid: boolean;
};

const DEFAULT: FaceVisualParams = {
  faceWidth: 1,
  faceHeight: 1,
  jawRoundness: 0.55,
  chinLength: 1,
  foreheadHeight: 1,
  eyeSize: 1,
  eyeTilt: 0,
  browThickness: 1.6,
  browArch: 0.35,
  noseLength: 1,
  noseWidth: 1,
  mouthWidth: 1,
  lipThickness: 1,
  hasDoubleEyelid: true,
};

const FACE_SHAPE: Record<string, Partial<FaceVisualParams>> = {
  face_oval: { faceWidth: 1, faceHeight: 1.02, jawRoundness: 0.55 },
  face_round: { faceWidth: 1.12, faceHeight: 0.96, jawRoundness: 0.88 },
  face_square: { faceWidth: 1.06, faceHeight: 1.02, jawRoundness: 0.18 },
  face_long: { faceWidth: 0.9, faceHeight: 1.14, jawRoundness: 0.42 },
  face_heart: { faceWidth: 1.08, faceHeight: 1.04, jawRoundness: 0.28, chinLength: 0.88 },
};

const FOREHEAD: Record<string, Partial<FaceVisualParams>> = {
  forehead_wide_high: { foreheadHeight: 1.22, faceWidth: 1.06 },
  forehead_wide_low: { foreheadHeight: 0.86, faceWidth: 1.08 },
  forehead_narrow_high: { foreheadHeight: 1.14, faceWidth: 0.92 },
  forehead_narrow_low: { foreheadHeight: 0.82, faceWidth: 0.9 },
};

const EYES: Record<string, Partial<FaceVisualParams>> = {
  eyes_large_double_upturned: { eyeSize: 1.28, hasDoubleEyelid: true, eyeTilt: 7 },
  eyes_large_double_downturned: { eyeSize: 1.28, hasDoubleEyelid: true, eyeTilt: -6 },
  eyes_large_single_upturned: { eyeSize: 1.28, hasDoubleEyelid: false, eyeTilt: 7 },
  eyes_large_single_downturned: { eyeSize: 1.28, hasDoubleEyelid: false, eyeTilt: -6 },
  eyes_small_double_upturned: { eyeSize: 0.76, hasDoubleEyelid: true, eyeTilt: 7 },
  eyes_small_double_downturned: { eyeSize: 0.76, hasDoubleEyelid: true, eyeTilt: -6 },
  eyes_small_single_upturned: { eyeSize: 0.76, hasDoubleEyelid: false, eyeTilt: 7 },
  eyes_small_single_downturned: { eyeSize: 0.76, hasDoubleEyelid: false, eyeTilt: -6 },
};

const NOSE: Record<string, Partial<FaceVisualParams>> = {
  nose_high_wide: { noseLength: 1.18, noseWidth: 1.28 },
  nose_high_narrow: { noseLength: 1.18, noseWidth: 0.78 },
  nose_low_wide: { noseLength: 0.86, noseWidth: 1.28 },
  nose_low_narrow: { noseLength: 0.86, noseWidth: 0.78 },
};

const MOUTH: Record<string, Partial<FaceVisualParams>> = {
  mouth_large_full: { mouthWidth: 1.22, lipThickness: 1.35 },
  mouth_large_thin: { mouthWidth: 1.22, lipThickness: 0.72 },
  mouth_small_full: { mouthWidth: 0.82, lipThickness: 1.35 },
  mouth_small_thin: { mouthWidth: 0.82, lipThickness: 0.72 },
};

const CHIN: Record<string, Partial<FaceVisualParams>> = {
  chin_round: { jawRoundness: 0.82, chinLength: 1 },
  chin_square: { jawRoundness: 0.15, chinLength: 1.02 },
  chin_double: { jawRoundness: 0.72, chinLength: 1.1 },
};

const BROWS: Record<string, Partial<FaceVisualParams>> = {
  brow_straight_thick: { browArch: 0.05, browThickness: 2.4 },
  brow_straight_thin: { browArch: 0.05, browThickness: 1.1 },
  brow_arched_thick: { browArch: 0.9, browThickness: 2.4 },
  brow_arched_thin: { browArch: 0.9, browThickness: 1.1 },
};

function mergeParams(base: FaceVisualParams, patch: Partial<FaceVisualParams>): FaceVisualParams {
  return { ...base, ...patch };
}

function applyOption(
  params: FaceVisualParams,
  optionId: string | undefined,
  table: Record<string, Partial<FaceVisualParams>>,
): FaceVisualParams {
  if (!optionId || !table[optionId]) return params;
  return mergeParams(params, table[optionId]);
}

export function deriveFaceParams(selection: PhysiognomySelection): FaceVisualParams | null {
  if (!selection.face_shape) return null;

  let params = { ...DEFAULT };
  params = applyOption(params, selection.face_shape, FACE_SHAPE);
  params = applyOption(params, selection.forehead, FOREHEAD);
  params = applyOption(params, selection.eyes, EYES);
  params = applyOption(params, selection.nose, NOSE);
  params = applyOption(params, selection.mouth, MOUTH);
  params = applyOption(params, selection.chin, CHIN);
  params = applyOption(params, selection.eyebrows, BROWS);

  return params;
}

export function hasPhysiognomyFace(selection: PhysiognomySelection): boolean {
  return Object.values(selection).some(Boolean);
}
