/**
 * 한국어 조사 결합.
 *
 * 운세 문장은 십신·오행·지인 이름처럼 런타임에 정해지는 말을 문장에 끼워 넣는다.
 * `을(를)` 같은 표기를 그대로 두면 사용자에게 그대로 보이므로, 받침을 보고
 * 조사를 확정해서 붙인다.
 */

/** 마지막 글자에 받침이 있는지. 한글이 아니면 없는 것으로 본다. */
export function hasFinalConsonant(word: string): boolean {
  const last = word.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 목을 / 화를 */
export function withEulReul(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '을' : '를'}`;
}

/** 정재가 / 편관이 */
export function withIga(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '이' : '가'}`;
}

/** 임자는 / 갑진은 */
export function withEun(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '은' : '는'}`;
}

/** 수민과 / 지호와 */
export function withGwa(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '과' : '와'}`;
}

/**
 * 받침 있는 말 뒤 `으로`, 없는 말 뒤 `로`.
 * `ㄹ` 받침은 예외로 `로`를 쓴다 (물로, 별로).
 */
export function withRo(word: string): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  const isHangul = !Number.isNaN(code) && code >= 0xac00 && code <= 0xd7a3;
  if (!isHangul) return `${word}로`;
  const jongseong = (code - 0xac00) % 28;
  // 8 = ㄹ
  return `${word}${jongseong === 0 || jongseong === 8 ? '로' : '으로'}`;
}

/** 마음이에요 / 사이예요 */
export function withIyeyo(word: string): string {
  return `${word}${hasFinalConsonant(word) ? '이에요' : '예요'}`;
}

/** `을(를)` 같은 병기 표기 → [받침 있을 때, 받침 없을 때] */
const PARTICLE_FORMS: Record<string, [string, string]> = {
  '을(를)': ['을', '를'],
  '를(을)': ['을', '를'],
  '이(가)': ['이', '가'],
  '가(이)': ['이', '가'],
  '은(는)': ['은', '는'],
  '는(은)': ['은', '는'],
  '과(와)': ['과', '와'],
  '와(과)': ['과', '와'],
  '으로(로)': ['으로', '로'],
  '로(으로)': ['으로', '로'],
};

const PARTICLE_PATTERN = /(.)(을\(를\)|를\(을\)|이\(가\)|가\(이\)|은\(는\)|는\(은\)|과\(와\)|와\(과\)|으로\(로\)|로\(으로\))/g;

/**
 * 문장에 남은 `을(를)` 같은 표기를 앞 글자 받침에 맞춰 확정한다.
 *
 * 새 문장은 `withEulReul` 같은 헬퍼로 조립하는 게 맞고, 이 함수는 시드·팩
 * 데이터에서 표기가 새어 나올 때를 대비한 마지막 안전망이다. 앞 글자를 보지
 * 않고 한쪽 형태로 몰아 버리면 `체계를`처럼 틀린 조사가 그대로 남는다.
 */
export function resolveParticles(text: string): string {
  return text.replace(PARTICLE_PATTERN, (_match, prev: string, form: string) => {
    const forms = PARTICLE_FORMS[form];
    if (!forms) return `${prev}${form}`;
    return `${prev}${hasFinalConsonant(prev) ? forms[0] : forms[1]}`;
  });
}
