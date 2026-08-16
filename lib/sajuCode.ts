import { BLOOD_TYPE_OPTIONS, MBTI_OPTIONS } from '@/lib/idCardFields';
import type {
  BirthCalendar,
  BloodType,
  Gender,
  MbtiType,
  Profile,
} from '@/lib/types';

/** 공유·가져오기용 사주 코드 페이로드 */
export type SajuCodePayload = {
  name: string;
  birthDate: string;
  birthCalendar?: BirthCalendar;
  birthLunarDate?: string;
  birthLeapMonth?: boolean;
  birthTime?: string;
  gender?: Gender;
  mbti?: MbtiType;
  bloodType?: BloodType;
};

export type SajuCodeDecodeOk = { ok: true; payload: SajuCodePayload };
export type SajuCodeDecodeErr = { ok: false; error: string };
export type SajuCodeDecodeResult = SajuCodeDecodeOk | SajuCodeDecodeErr;

/** 대문자 Base32 (A–Z, 2–7), 하이픈 없음 */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHm(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

function utf8Bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function utf8FromBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function parseYmdParts(ymd: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1900 || y > 2155 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return [y, mo, d];
}

function writeDate(out: number[], ymd: string): boolean {
  const parts = parseYmdParts(ymd);
  if (!parts) return false;
  out.push(parts[0] - 1900, parts[1], parts[2]);
  return true;
}

function readDate(bytes: Uint8Array, i: number): { ymd: string; next: number } | null {
  if (i + 2 >= bytes.length) return null;
  const y = 1900 + bytes[i]!;
  const mo = bytes[i + 1]!;
  const d = bytes[i + 2]!;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const ymd = `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { ymd, next: i + 3 };
}

/** 이름 UTF-8 + 양력·옵션. 음력은 길이 때문에 생략.
 * flags: bit0–1 달력, bit2–3 성별(01남/10여), bit4 시간, bit5 MBTI, bit6 혈액형
 */
function pack(payload: SajuCodePayload): Uint8Array | null {
  let flags = 0;
  if (payload.birthCalendar === 'solar') flags |= 0b01;
  if (payload.birthCalendar === 'lunar') flags |= 0b10;
  if (payload.gender === 'male') flags |= 0b01 << 2;
  if (payload.gender === 'female') flags |= 0b10 << 2;
  if (payload.birthTime) flags |= 1 << 4;
  if (payload.mbti) flags |= 1 << 5;
  if (payload.bloodType) flags |= 1 << 6;

  const out: number[] = [3, flags];
  if (!writeDate(out, payload.birthDate)) return null;
  if (payload.birthTime) {
    const [h, m] = payload.birthTime.split(':').map(Number);
    if (h == null || m == null || h > 23 || m > 59) return null;
    out.push(h, m);
  }
  if (payload.mbti) {
    const idx = MBTI_OPTIONS.indexOf(payload.mbti);
    if (idx < 0) return null;
    out.push(idx);
  }
  if (payload.bloodType) {
    const idx = BLOOD_TYPE_OPTIONS.indexOf(payload.bloodType);
    if (idx < 0) return null;
    out.push(idx);
  }
  out.push(...utf8Bytes(payload.name));
  return new Uint8Array(out);
}

function unpack(bytes: Uint8Array): SajuCodePayload | null {
  if (bytes.length < 6 || bytes[0] !== 3) return null;
  const flags = bytes[1]!;
  let i = 2;
  const birth = readDate(bytes, i);
  if (!birth) return null;
  i = birth.next;

  const payload: SajuCodePayload = { name: '', birthDate: birth.ymd };
  const calBits = flags & 0b11;
  if (calBits === 0b01) payload.birthCalendar = 'solar';
  if (calBits === 0b10) payload.birthCalendar = 'lunar';
  const genderBits = (flags >> 2) & 0b11;
  if (genderBits === 0b01) payload.gender = 'male';
  if (genderBits === 0b10) payload.gender = 'female';

  if (flags & (1 << 4)) {
    if (i + 1 >= bytes.length) return null;
    const h = bytes[i]!;
    const m = bytes[i + 1]!;
    if (h > 23 || m > 59) return null;
    payload.birthTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    i += 2;
  }
  if (flags & (1 << 5)) {
    if (i >= bytes.length) return null;
    const mbti = MBTI_OPTIONS[bytes[i]!];
    if (!mbti) return null;
    payload.mbti = mbti;
    i += 1;
  }
  if (flags & (1 << 6)) {
    if (i >= bytes.length) return null;
    const blood = BLOOD_TYPE_OPTIONS[bytes[i]!];
    if (!blood) return null;
    payload.bloodType = blood;
    i += 1;
  }

  const name = utf8FromBytes(bytes.subarray(i)).trim();
  if (!name) return null;
  payload.name = name;
  return payload;
}

function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]!;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function fromBase32(text: string): Uint8Array | null {
  const clean = text.toUpperCase().replace(/[^A-Z2-7]/g, '');
  if (!clean) return null;
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = B32.indexOf(clean[i]!);
    if (idx < 0) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

/** 대문자만, 구분 기호 없음 */
export function formatSajuCodeDisplay(code: string): string {
  const bare = code.replace(/[^A-Z2-7]/gi, '').toUpperCase();
  return bare || code;
}

/** 프로필에서 공유 가능한 페이로드 추출. 이름·생년월일 없으면 null */
export function buildSajuCodePayload(profile: Profile): SajuCodePayload | null {
  const name = profile.name?.trim();
  const birthDate = profile.birthDate?.trim();
  if (!name || !isYmd(birthDate)) return null;

  const payload: SajuCodePayload = { name, birthDate };
  if (profile.birthCalendar === 'solar' || profile.birthCalendar === 'lunar') {
    payload.birthCalendar = profile.birthCalendar;
  }
  if (profile.gender === 'male' || profile.gender === 'female') {
    payload.gender = profile.gender;
  }
  if (isHm(profile.birthTime)) payload.birthTime = profile.birthTime;
  if (MBTI_OPTIONS.includes(profile.mbti as MbtiType)) {
    payload.mbti = profile.mbti as MbtiType;
  }
  if (BLOOD_TYPE_OPTIONS.includes(profile.bloodType as BloodType)) {
    payload.bloodType = profile.bloodType as BloodType;
  }
  return payload;
}

export function encodeSajuCode(payload: SajuCodePayload): string {
  const packed = pack(payload);
  if (!packed) throw new Error('invalid saju payload');
  return toBase32(packed);
}

export function encodeSajuCodeFromProfile(profile: Profile): string | null {
  const payload = buildSajuCodePayload(profile);
  if (!payload) return null;
  return encodeSajuCode(payload);
}

export function extractSajuCodeToken(raw: string): string | null {
  // 공백·하이픈·안내 문구를 제거하고 Base32만 남김
  const cleaned = raw.toUpperCase().replace(/[^A-Z2-7]/g, '');
  if (cleaned.length < 10 || cleaned.length > 128) return null;
  return cleaned;
}

export function decodeSajuCode(raw: string): SajuCodeDecodeResult {
  const token = extractSajuCodeToken(raw);
  if (!token) {
    return {
      ok: false,
      error: '사주 코드를 찾을 수 없습니다. 코드를 다시 확인해 주세요.',
    };
  }

  const bytes = fromBase32(token);
  if (!bytes || bytes.length < 6) {
    return { ok: false, error: '코드가 손상되었거나 올바르지 않습니다.' };
  }
  const payload = unpack(bytes);
  if (!payload) {
    return { ok: false, error: '코드에 이름·생년월일이 없거나 형식이 올바르지 않습니다.' };
  }
  return { ok: true, payload };
}

export function formatSajuShareMessage(code: string, name: string): string {
  return [
    `운명人지도 사주 코드 — ${name}`,
    '',
    formatSajuCodeDisplay(code),
    '',
    '지인 탭에서 「사주코드 추가」에 붙여넣으면 친구로 등록할 수 있어요.',
    '생년월일 등 개인정보가 포함됩니다. 믿을 수 있는 사람에게만 공유하세요.',
  ].join('\n');
}

/** 사주 코드 → 내 프로필 패치 (이름·생년월일 필수). */
export function profilePatchFromSajuCode(payload: SajuCodePayload): Partial<Profile> {
  const patch: Partial<Profile> = {
    name: payload.name.trim(),
    birthDate: payload.birthDate,
  };
  if (payload.birthCalendar === 'solar' || payload.birthCalendar === 'lunar') {
    patch.birthCalendar = payload.birthCalendar;
  }
  if (payload.birthLunarDate) patch.birthLunarDate = payload.birthLunarDate;
  if (typeof payload.birthLeapMonth === 'boolean') {
    patch.birthLeapMonth = payload.birthLeapMonth;
  }
  if (isHm(payload.birthTime)) patch.birthTime = payload.birthTime;
  if (payload.gender === 'male' || payload.gender === 'female') {
    patch.gender = payload.gender;
  }
  if (payload.mbti && MBTI_OPTIONS.includes(payload.mbti)) patch.mbti = payload.mbti;
  if (payload.bloodType && BLOOD_TYPE_OPTIONS.includes(payload.bloodType)) {
    patch.bloodType = payload.bloodType;
  }
  return patch;
}
