# 사주 코드 Base32 대문자 round-trip — `python3 scripts/verify-saju-code.py`
B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
MBTI = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP',
]
BLOOD = ['A', 'B', 'O', 'AB']


def to_b32(data):
    bits = val = 0
    out = []
    for b in data:
        val = (val << 8) | b
        bits += 8
        while bits >= 5:
            out.append(B32[(val >> (bits - 5)) & 31])
            bits -= 5
    if bits:
        out.append(B32[(val << (5 - bits)) & 31])
    return ''.join(out)


def from_b32(text):
    clean = ''.join(c for c in text.upper() if c in B32)
    bits = val = 0
    out = bytearray()
    for ch in clean:
        val = (val << 5) | B32.index(ch)
        bits += 5
        if bits >= 8:
            out.append((val >> (bits - 8)) & 255)
            bits -= 8
    return bytes(out)


def pack(p):
    flags = 0
    if p.get('birthCalendar') == 'solar':
        flags |= 0b01
    if p.get('birthCalendar') == 'lunar':
        flags |= 0b10
    if p.get('gender') == 'male':
        flags |= 0b01 << 2
    if p.get('gender') == 'female':
        flags |= 0b10 << 2
    if p.get('birthTime'):
        flags |= 1 << 4
    if p.get('mbti'):
        flags |= 1 << 5
    if p.get('bloodType'):
        flags |= 1 << 6
    y, mo, d = map(int, p['birthDate'].split('-'))
    out = bytearray([3, flags, y - 1900, mo, d])
    if p.get('birthTime'):
        h, m = map(int, p['birthTime'].split(':'))
        out.extend([h, m])
    if p.get('mbti'):
        out.append(MBTI.index(p['mbti']))
    if p.get('bloodType'):
        out.append(BLOOD.index(p['bloodType']))
    out.extend(p['name'].encode('utf-8'))
    return bytes(out)


def unpack(raw):
    if not raw or raw[0] != 3:
        return None
    flags = raw[1]
    i = 2
    y, mo, d = 1900 + raw[i], raw[i + 1], raw[i + 2]
    i += 3
    payload = {
        'name': '',
        'birthDate': '{:04d}-{:02d}-{:02d}'.format(y, mo, d),
    }
    if (flags & 0b11) == 0b01:
        payload['birthCalendar'] = 'solar'
    if (flags & 0b11) == 0b10:
        payload['birthCalendar'] = 'lunar'
    gender_bits = (flags >> 2) & 0b11
    if gender_bits == 0b01:
        payload['gender'] = 'male'
    if gender_bits == 0b10:
        payload['gender'] = 'female'
    if flags & (1 << 4):
        payload['birthTime'] = '{:02d}:{:02d}'.format(raw[i], raw[i + 1])
        i += 2
    if flags & (1 << 5):
        payload['mbti'] = MBTI[raw[i]]
        i += 1
    if flags & (1 << 6):
        payload['bloodType'] = BLOOD[raw[i]]
        i += 1
    payload['name'] = raw[i:].decode('utf-8').strip()
    return payload if payload['name'] else None


def extract(raw):
    cleaned = ''.join(c for c in raw.upper() if c in B32)
    if len(cleaned) < 10 or len(cleaned) > 128:
        return None
    return cleaned


sample = {
    'name': '박종만',
    'birthDate': '1990-05-12',
    'birthCalendar': 'solar',
    'gender': 'male',
    'birthTime': '14:30',
    'mbti': 'INTJ',
    'bloodType': 'A',
}
code = to_b32(pack(sample))
assert '-' not in code
short = to_b32(pack({'name': '김', 'birthDate': '1990-05-12', 'birthCalendar': 'solar', 'gender': 'female'}))
assert len(short) < 16
assert extract(short) == short
assert unpack(from_b32(short))['gender'] == 'female'

msg = '운명人지도 사주 코드 — {}\n\n{}\n\n안내'.format(sample['name'], code)
assert unpack(from_b32(extract(msg))) == sample
assert unpack(from_b32(extract('{} {}'.format(code[:10], code[10:])))) == sample
print('code:', code, '({} chars)'.format(len(code)))
print('short:', short, '({} chars)'.format(len(short)))
print('OK')
