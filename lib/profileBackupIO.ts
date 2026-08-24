import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { EncryptedBackupEnvelope } from '@/lib/backupCrypto';
import { loadHistory, type HistoryEntry } from '@/lib/history';
import {
  buildEncryptedBackupFile,
  decryptEncryptedBackup,
  inspectBackupFile,
  profileBackupFileName,
  type ProfileBackup,
} from '@/lib/profileBackup';
import { appStorage } from '@/lib/storage';
import type { ContactProfile, Profile } from '@/lib/types';

const SAF_DIR_KEY = '@unmyeong/backup-saf-dir';

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return String(err);
}

function isMissingNativeModule(err: unknown): boolean {
  const msg = errorMessage(err);
  return /native module|Cannot find native|ExpoDocumentPicker|ExpoFileSystem|not found/i.test(msg);
}

/** createFileAsync는 확장자 없이 이름을 받는다. */
function backupBaseName(fileName: string): string {
  return fileName.replace(/\.json$/i, '');
}

async function resolveAndroidDownloadsDir(): Promise<
  { ok: true; directoryUri: string } | { ok: false; canceled?: boolean; error: string }
> {
  const saf = FileSystem.StorageAccessFramework;
  const cached = await appStorage.getItem(SAF_DIR_KEY);
  if (cached) {
    try {
      await saf.readDirectoryAsync(cached);
      return { ok: true, directoryUri: cached };
    } catch {
      await appStorage.removeItem(SAF_DIR_KEY);
    }
  }

  const downloadsHint = saf.getUriForDirectoryInRoot('Download');
  const permissions = await saf.requestDirectoryPermissionsAsync(downloadsHint);
  if (!permissions.granted) {
    return { ok: false, canceled: true, error: '' };
  }

  await appStorage.setItem(SAF_DIR_KEY, permissions.directoryUri);
  return { ok: true, directoryUri: permissions.directoryUri };
}

async function saveBackupToAndroidDownloads(
  json: string,
  fileName: string,
): Promise<
  | { ok: true; fileName: string }
  | { ok: false; error: string; canceled?: boolean }
> {
  const dir = await resolveAndroidDownloadsDir();
  if (!dir.ok) return dir;

  const saf = FileSystem.StorageAccessFramework;
  const dest = await saf.createFileAsync(
    dir.directoryUri,
    backupBaseName(fileName),
    'application/json',
  );
  await FileSystem.writeAsStringAsync(dest, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return { ok: true, fileName };
}

async function shareBackupFile(
  json: string,
  fileName: string,
): Promise<{ ok: true; fileName: string } | { ok: false; error: string }> {
  if (!(await Sharing.isAvailableAsync())) {
    return { ok: false, error: '이 기기에서는 파일 공유를 지원하지 않습니다.' };
  }
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    return { ok: false, error: '임시 저장 공간을 사용할 수 없습니다.' };
  }
  const path = `${cacheDir}${fileName}`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: '운명인지도 백업',
    UTI: 'public.json',
  });
  return { ok: true, fileName };
}

export type ExportBackupResult =
  | { ok: true; fileName: string; savedToDownloads: boolean }
  | { ok: false; error: string; canceled?: boolean };

export async function exportProfileBackupFile(
  profile: Profile,
  contacts: ContactProfile[],
  password: string,
  history?: HistoryEntry[],
): Promise<ExportBackupResult> {
  try {
    if (Platform.OS === 'web') {
      return { ok: false, error: '웹에서는 파일 내보내기를 지원하지 않습니다.' };
    }
    if (!password.trim()) {
      return { ok: false, error: '백업 비밀번호를 입력해 주세요.' };
    }

    const fileName = profileBackupFileName();
    const historyEntries = history ?? (await loadHistory());
    const envelope = await buildEncryptedBackupFile(
      profile,
      contacts,
      password,
      historyEntries,
    );
    const json = JSON.stringify(envelope, null, 2);

    if (Platform.OS === 'android') {
      const saved = await saveBackupToAndroidDownloads(json, fileName);
      if (!saved.ok) return saved;
      return { ok: true, fileName: saved.fileName, savedToDownloads: true };
    }

    const shared = await shareBackupFile(json, fileName);
    if (!shared.ok) return shared;
    return { ok: true, fileName: shared.fileName, savedToDownloads: false };
  } catch (err) {
    if (isMissingNativeModule(err)) {
      return {
        ok: false,
        error: '이 앱 빌드에는 파일 기능이 없습니다. 최신 APK로 다시 설치해 주세요.',
      };
    }
    return { ok: false, error: `파일을 저장하지 못했습니다. (${errorMessage(err)})` };
  }
}

export type ImportBackupPickResult =
  | { ok: true; kind: 'plain'; backup: ProfileBackup }
  | { ok: true; kind: 'encrypted'; envelope: EncryptedBackupEnvelope }
  | { ok: false; error: string; canceled?: boolean };

const DEV_BACKUP_NAME_RE = /^unmyeong-injido-backup-\d{8}\.json$/i;

/** Expo Go documentDirectory → 상위 Documents까지 탐색 (simctl이 루트 Documents에 넣는 경우). */
function devBackupSearchDirs(documentDir: string): string[] {
  const dirs: string[] = [];
  let path = documentDir.replace(/\/$/, '');
  for (let i = 0; i < 8 && path.length > 1; i++) {
    dirs.push(`${path}/`);
    const parent = path.slice(0, path.lastIndexOf('/'));
    if (!parent || parent === path) break;
    path = parent;
  }
  return dirs;
}

/** iOS 시뮬 dev — Expo Documents에 넣은 백업 JSON 경로 (없으면 null). */
export async function findDevDocumentsBackupUri(): Promise<string | null> {
  if (!__DEV__ || Platform.OS !== 'ios') return null;
  const dir = FileSystem.documentDirectory;
  if (!dir) return null;

  for (const searchDir of devBackupSearchDirs(dir)) {
    try {
      const names = await FileSystem.readDirectoryAsync(searchDir);
      const match = names
        .filter((name) => DEV_BACKUP_NAME_RE.test(name))
        .sort()
        .pop();
      if (match) return `${searchDir}${match}`;
    } catch {
      // 권한·존재하지 않는 상위 경로는 무시
    }
  }
  return null;
}

async function inspectBackupUri(uri: string): Promise<ImportBackupPickResult> {
  const raw = await readPickedText(uri);
  return inspectBackupRaw(raw);
}

function inspectBackupRaw(raw: string): ImportBackupPickResult {
  if (!raw.trim()) {
    return { ok: false, error: '선택한 파일이 비어 있습니다.' };
  }
  const inspected = inspectBackupFile(raw);
  if (inspected.kind === 'error') return { ok: false, error: inspected.error };
  if (inspected.kind === 'plain') return { ok: true, kind: 'plain', backup: inspected.backup };
  return { ok: true, kind: 'encrypted', envelope: inspected.envelope };
}

/** iOS 시뮬 dev — Expo Documents 백업을 피커 없이 읽는다. */
export async function pickDevDocumentsBackup(): Promise<
  ImportBackupPickResult | { ok: false; notFound: true }
> {
  const uri = await findDevDocumentsBackupUri();
  if (!uri) return { ok: false, notFound: true };
  try {
    return await inspectBackupUri(uri);
  } catch (err) {
    return {
      ok: false,
      error: `파일을 읽지 못했습니다. (${errorMessage(err)})`,
    };
  }
}

async function readPickedText(uri: string): Promise<string> {
  const errors: string[] = [];

  // 1) 신규 File API — Android content:// · 캐시 경로에서 가장 안정적
  try {
    const file = new File(uri);
    return await file.text();
  } catch (err) {
    errors.push(`File.text: ${errorMessage(err)}`);
  }

  // 2) fetch (일부 file:// / content://)
  try {
    const res = await fetch(uri);
    if (res.ok) return await res.text();
    errors.push(`fetch: HTTP ${res.status}`);
  } catch (err) {
    errors.push(`fetch: ${errorMessage(err)}`);
  }

  // 3) legacy UTF-8
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    errors.push(`legacy.utf8: ${errorMessage(err)}`);
  }

  // 4) legacy Base64 → UTF-8
  try {
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch (err) {
    errors.push(`legacy.base64: ${errorMessage(err)}`);
  }

  throw new Error(errors.join(' | '));
}

/** 파일만 고른다. 암호 백업이면 envelope를 돌려주고, UI에서 비밀번호를 받은 뒤 unlock한다. */
export async function pickProfileBackupFile(): Promise<ImportBackupPickResult> {
  try {
    let raw = '';

    // Android/Expo Go에서 DocumentPicker 캐시 URI가 legacy FS로 안 열리는 경우가 있어
    // 우선 신규 File.pickFileAsync를 쓰고, 실패하면 DocumentPicker로 폴백한다.
    try {
      const picked = await File.pickFileAsync({
        mimeTypes: ['application/json', 'text/plain', '*/*'],
      });
      if (picked.canceled || !picked.result) {
        return { ok: false, error: '', canceled: true };
      }
      raw = await picked.result.text();
    } catch {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]?.uri) {
        return { ok: false, error: '', canceled: true };
      }
      raw = await readPickedText(picked.assets[0].uri);
    }

    return await inspectBackupRaw(raw);
  } catch (err) {
    if (isMissingNativeModule(err)) {
      return {
        ok: false,
        error: '이 앱 빌드에는 파일 기능이 없습니다. 최신 APK로 다시 설치해 주세요.',
      };
    }
    return {
      ok: false,
      error: `파일을 읽지 못했습니다. 폰의 파일/다운로드에서 JSON을 다시 골라 주세요. (${errorMessage(err)})`,
    };
  }
}

export function unlockEncryptedBackup(
  envelope: EncryptedBackupEnvelope,
  password: string,
): { ok: true; backup: ProfileBackup } | { ok: false; error: string } {
  const parsed = decryptEncryptedBackup(envelope, password);
  if (!parsed.ok) return parsed;
  return { ok: true, backup: parsed.backup };
}
