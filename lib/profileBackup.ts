import {
  decryptBackupEnvelope,
  encryptBackupJson,
  isEncryptedBackupEnvelope,
  type EncryptedBackupEnvelope,
} from '@/lib/backupCrypto';
import type { HistoryEntry } from '@/lib/history';
import type { ContactProfile, Profile } from '@/lib/types';

export const PROFILE_BACKUP_VERSION = 2 as const;
export const PROFILE_BACKUP_APP = 'unmyeong-injido';

const SUPPORTED_BACKUP_VERSIONS = new Set([1, 2]);

export type ProfileBackup = {
  version: typeof PROFILE_BACKUP_VERSION | 1;
  app: typeof PROFILE_BACKUP_APP;
  exportedAt: string;
  profile: Profile;
  contacts: ContactProfile[];
  /** v2+ — 타로·운세·궁합 로컬 기록 */
  history?: HistoryEntry[];
};

export type ProfileBackupParseOk = { ok: true; backup: ProfileBackup };
export type ProfileBackupParseErr = { ok: false; error: string };
export type ProfileBackupParseResult = ProfileBackupParseOk | ProfileBackupParseErr;

export type BackupFileInspect =
  | { kind: 'plain'; backup: ProfileBackup }
  | { kind: 'encrypted'; envelope: EncryptedBackupEnvelope }
  | { kind: 'error'; error: string };

export function buildProfileBackup(
  profile: Profile,
  contacts: ContactProfile[],
  history: HistoryEntry[] = [],
  exportedAt = new Date().toISOString(),
): ProfileBackup {
  return {
    version: PROFILE_BACKUP_VERSION,
    app: PROFILE_BACKUP_APP,
    exportedAt,
    profile,
    contacts,
    history,
  };
}

export function profileBackupFileName(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `unmyeong-injido-backup-${y}${m}${d}.json`;
}

export function parseProfileBackupJson(raw: string): ProfileBackupParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'JSON 파일을 읽지 못했습니다. 파일 형식을 확인해 주세요.' };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: '올바른 운명인지도 백업 파일이 아닙니다.' };
  }

  const row = data as Record<string, unknown>;
  if (isEncryptedBackupEnvelope(row)) {
    return {
      ok: false,
      error: '암호화된 백업입니다. 비밀번호를 입력해 복구해 주세요.',
    };
  }
  if (row.app != null && row.app !== PROFILE_BACKUP_APP) {
    return { ok: false, error: '운명人지도 백업 파일이 아닙니다.' };
  }
  if (row.version != null && !SUPPORTED_BACKUP_VERSIONS.has(Number(row.version))) {
    return { ok: false, error: `지원하지 않는 백업 버전입니다. (version ${String(row.version)})` };
  }

  const profile =
    row.profile && typeof row.profile === 'object' ? (row.profile as Profile) : {};
  const contacts = Array.isArray(row.contacts) ? (row.contacts as ContactProfile[]) : [];
  const history = Array.isArray(row.history) ? (row.history as HistoryEntry[]) : [];
  const version = Number(row.version) === 1 ? 1 : PROFILE_BACKUP_VERSION;

  return {
    ok: true,
    backup: {
      version,
      app: PROFILE_BACKUP_APP,
      exportedAt: typeof row.exportedAt === 'string' ? row.exportedAt : new Date().toISOString(),
      profile,
      contacts,
      history,
    },
  };
}

/** 파일 내용이 평문인지 암호 봉투인지 판별 */
export function inspectBackupFile(raw: string): BackupFileInspect {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { kind: 'error', error: 'JSON 파일을 읽지 못했습니다. 파일 형식을 확인해 주세요.' };
  }
  if (!data || typeof data !== 'object') {
    return { kind: 'error', error: '올바른 운명인지도 백업 파일이 아닙니다.' };
  }
  if (isEncryptedBackupEnvelope(data)) {
    return { kind: 'encrypted', envelope: data };
  }
  const parsed = parseProfileBackupJson(raw);
  if (!parsed.ok) return { kind: 'error', error: parsed.error };
  return { kind: 'plain', backup: parsed.backup };
}

export async function buildEncryptedBackupFile(
  profile: Profile,
  contacts: ContactProfile[],
  password: string,
  history: HistoryEntry[] = [],
): Promise<EncryptedBackupEnvelope> {
  const backup = buildProfileBackup(profile, contacts, history);
  return encryptBackupJson(JSON.stringify(backup), password, backup.exportedAt);
}

export function decryptEncryptedBackup(
  envelope: EncryptedBackupEnvelope,
  password: string,
): ProfileBackupParseResult {
  const decrypted = decryptBackupEnvelope(envelope, password);
  if (!decrypted.ok) return decrypted;
  return parseProfileBackupJson(decrypted.plainJson);
}
