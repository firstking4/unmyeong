import { Platform } from 'react-native';

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

const memoryStorage: StorageLike = {
  async getItem(key) {
    return memory.has(key) ? memory.get(key)! : null;
  },
  async setItem(key, value) {
    memory.set(key, value);
  },
  async removeItem(key) {
    memory.delete(key);
  },
};

const webStorage: StorageLike = {
  async getItem(key) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return memoryStorage.getItem(key);
    }
  },
  async setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      await memoryStorage.setItem(key, value);
    }
  },
  async removeItem(key) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      await memoryStorage.removeItem(key);
    }
  },
};

let cached: StorageLike | null = null;

async function resolveStorage(): Promise<StorageLike> {
  if (cached) return cached;

  if (Platform.OS === 'web') {
    cached = webStorage;
    return cached;
  }

  try {
    const mod = await import('@react-native-async-storage/async-storage');
    const AsyncStorage = mod.default;
    // Probe once — AsyncStorage 3.x throws when native module is missing.
    await AsyncStorage.getItem('__probe__');
    cached = {
      getItem: (k) => AsyncStorage.getItem(k),
      setItem: (k, v) => AsyncStorage.setItem(k, v),
      removeItem: (k) => AsyncStorage.removeItem(k),
    };
  } catch {
    cached = memoryStorage;
  }

  return cached;
}

/** Safe key-value storage — never throws unhandled AsyncStorage native errors. */
export const appStorage: StorageLike = {
  async getItem(key) {
    try {
      return await (await resolveStorage()).getItem(key);
    } catch {
      return memoryStorage.getItem(key);
    }
  },
  async setItem(key, value) {
    try {
      await (await resolveStorage()).setItem(key, value);
    } catch {
      await memoryStorage.setItem(key, value);
    }
  },
  async removeItem(key) {
    try {
      await (await resolveStorage()).removeItem(key);
    } catch {
      await memoryStorage.removeItem(key);
    }
  },
};
