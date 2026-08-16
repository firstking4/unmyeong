import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';

const PBKDF2_ITERATIONS = 120_000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type EncryptedBackupEnvelope = {
  version: 2;
  app: 'unmyeong-injido';
  format: 'encrypted';
  kdf: 'pbkdf2-sha256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  exportedAt: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function randomBytes(length: number): Promise<Uint8Array> {
  return new Uint8Array(await Crypto.getRandomBytesAsync(length));
}

function deriveKey(password: string, salt: Uint8Array, iterations: number): Uint8Array {
  return pbkdf2(sha256, password, salt, { c: iterations, dkLen: KEY_BYTES });
}

/** 평문 JSON → 비밀번호로 암호화한 봉투 객체 */
export async function encryptBackupJson(
  plainJson: string,
  password: string,
  exportedAt = new Date().toISOString(),
): Promise<EncryptedBackupEnvelope> {
  const salt = await randomBytes(SALT_BYTES);
  const iv = await randomBytes(IV_BYTES);
  const key = deriveKey(password, salt, PBKDF2_ITERATIONS);
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(new TextEncoder().encode(plainJson));

  return {
    version: 2,
    app: 'unmyeong-injido',
    format: 'encrypted',
    kdf: 'pbkdf2-sha256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
    exportedAt,
  };
}

export type DecryptBackupOk = { ok: true; plainJson: string };
export type DecryptBackupErr = { ok: false; error: string };
export type DecryptBackupResult = DecryptBackupOk | DecryptBackupErr;

/** 암호 봉투 → 평문 JSON. 비밀번호 오류 시 실패. */
export function decryptBackupEnvelope(
  envelope: EncryptedBackupEnvelope,
  password: string,
): DecryptBackupResult {
  try {
    const salt = base64ToBytes(envelope.salt);
    const iv = base64ToBytes(envelope.iv);
    const ciphertext = base64ToBytes(envelope.ciphertext);
    if (salt.length < 8 || iv.length !== IV_BYTES || ciphertext.length < 16) {
      return { ok: false, error: '손상된 백업 파일입니다.' };
    }
    const iterations =
      typeof envelope.iterations === 'number' && envelope.iterations > 0
        ? envelope.iterations
        : PBKDF2_ITERATIONS;
    const key = deriveKey(password, salt, iterations);
    const cipher = gcm(key, iv);
    const plain = cipher.decrypt(ciphertext);
    return { ok: true, plainJson: new TextDecoder().decode(plain) };
  } catch {
    return { ok: false, error: '비밀번호가 맞지 않거나 파일이 손상되었습니다.' };
  }
}

export function isEncryptedBackupEnvelope(data: unknown): data is EncryptedBackupEnvelope {
  if (!data || typeof data !== 'object') return false;
  const row = data as Record<string, unknown>;
  return (
    row.format === 'encrypted' &&
    row.app === 'unmyeong-injido' &&
    typeof row.salt === 'string' &&
    typeof row.iv === 'string' &&
    typeof row.ciphertext === 'string'
  );
}
