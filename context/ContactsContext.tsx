import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { appStorage } from '@/lib/storage';
import { logContactAdd } from '@/lib/firebase/analytics';
import type {
  BirthCalendar,
  BloodType,
  ContactProfile,
  ContactRelationship,
  Gender,
  MbtiType,
} from '@/lib/types';

const STORAGE_KEY = '@unmyeong/contacts';

export type ContactInput = {
  name: string;
  relationship: ContactRelationship;
  birthDate: string;
  birthCalendar?: BirthCalendar;
  birthLunarDate?: string;
  birthLeapMonth?: boolean;
  birthTime?: string;
  gender?: Gender;
  mbti?: MbtiType;
  bloodType?: BloodType;
};

type ContactsContextValue = {
  contacts: ContactProfile[];
  loaded: boolean;
  getContact: (id: string) => ContactProfile | undefined;
  findDuplicate: (name: string, birthDate: string) => ContactProfile | undefined;
  addContact: (input: ContactInput) => Promise<ContactProfile>;
  updateContact: (id: string, patch: Partial<ContactInput>) => Promise<ContactProfile | null>;
  togglePinned: (id: string) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  /** 백업 복원 등 — 목록 전체를 교체한다. */
  replaceContacts: (next: ContactProfile[]) => Promise<void>;
};

const ContactsContext = createContext<ContactsContextValue | null>(null);

const RELATIONSHIPS: ContactRelationship[] = ['연인', '친구', '가족', '동료', '기타'];
const BLOOD: BloodType[] = ['A', 'B', 'O', 'AB'];
const MBTI: MbtiType[] = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISFJ',
  'ESTJ',
  'ESFJ',
  'ISTP',
  'ISFP',
  'ESTP',
  'ESFP',
];

function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeContact(raw: unknown): ContactProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<ContactProfile>;
  if (typeof row.id !== 'string' || !row.id.trim()) return null;
  if (typeof row.name !== 'string' || !row.name.trim()) return null;
  if (!RELATIONSHIPS.includes(row.relationship as ContactRelationship)) return null;
  if (!isYmd(row.birthDate)) return null;

  const now = new Date().toISOString();
  const contact: ContactProfile = {
    id: row.id.trim(),
    name: row.name.trim(),
    relationship: row.relationship as ContactRelationship,
    birthDate: row.birthDate,
    createdAt: typeof row.createdAt === 'string' ? row.createdAt : now,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : now,
  };

  if (row.birthCalendar === 'solar' || row.birthCalendar === 'lunar') {
    contact.birthCalendar = row.birthCalendar;
  }
  if (isYmd(row.birthLunarDate)) contact.birthLunarDate = row.birthLunarDate;
  if (typeof row.birthLeapMonth === 'boolean') contact.birthLeapMonth = row.birthLeapMonth;
  if (typeof row.birthTime === 'string' && /^\d{2}:\d{2}$/.test(row.birthTime)) {
    contact.birthTime = row.birthTime;
  }
  if (row.gender === 'male' || row.gender === 'female') contact.gender = row.gender;
  if (MBTI.includes(row.mbti as MbtiType)) contact.mbti = row.mbti as MbtiType;
  if (BLOOD.includes(row.bloodType as BloodType)) contact.bloodType = row.bloodType as BloodType;
  if (row.pinned === true) contact.pinned = true;

  return contact;
}

function sanitizeList(raw: unknown): ContactProfile[] {
  if (!Array.isArray(raw)) return [];
  const out: ContactProfile[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const contact = sanitizeContact(item);
    if (!contact || seen.has(contact.id)) continue;
    seen.add(contact.id);
    out.push(contact);
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function createId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<ContactProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await appStorage.getItem(STORAGE_KEY);
        if (alive && raw) setContacts(sanitizeList(JSON.parse(raw)));
      } catch {
        // ignore corrupt storage
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(async (next: ContactProfile[]) => {
    setContacts(next);
    await appStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const getContact = useCallback(
    (id: string) => contacts.find((item) => item.id === id),
    [contacts],
  );

  const findDuplicate = useCallback(
    (name: string, birthDate: string) => {
      const n = name.trim();
      return contacts.find(
        (item) => item.name.trim() === n && item.birthDate === birthDate,
      );
    },
    [contacts],
  );

  const addContact = useCallback(
    async (input: ContactInput) => {
      const now = new Date().toISOString();
      const contact: ContactProfile = {
        id: createId(),
        name: input.name.trim(),
        relationship: input.relationship,
        birthDate: input.birthDate,
        birthCalendar: input.birthCalendar,
        birthLunarDate: input.birthLunarDate,
        birthLeapMonth: input.birthLeapMonth,
        birthTime: input.birthTime,
        gender: input.gender,
        mbti: input.mbti,
        bloodType: input.bloodType,
        createdAt: now,
        updatedAt: now,
      };
      await persist([contact, ...contacts]);
      void logContactAdd();
      return contact;
    },
    [contacts, persist],
  );

  const updateContact = useCallback(
    async (id: string, patch: Partial<ContactInput>) => {
      let updated: ContactProfile | null = null;
      const next = contacts.map((item) => {
        if (item.id !== id) return item;
        const merged: ContactProfile = {
          ...item,
          name: patch.name?.trim() ?? item.name,
          relationship: patch.relationship ?? item.relationship,
          birthDate: patch.birthDate ?? item.birthDate,
          updatedAt: new Date().toISOString(),
        };
        if (patch.birthCalendar !== undefined) merged.birthCalendar = patch.birthCalendar;
        if (patch.birthLunarDate !== undefined) merged.birthLunarDate = patch.birthLunarDate;
        if (patch.birthLeapMonth !== undefined) merged.birthLeapMonth = patch.birthLeapMonth;
        if ('birthTime' in patch) {
          if (patch.birthTime) merged.birthTime = patch.birthTime;
          else delete merged.birthTime;
        }
        if ('gender' in patch) {
          if (patch.gender) merged.gender = patch.gender;
          else delete merged.gender;
        }
        if ('mbti' in patch) {
          if (patch.mbti) merged.mbti = patch.mbti;
          else delete merged.mbti;
        }
        if ('bloodType' in patch) {
          if (patch.bloodType) merged.bloodType = patch.bloodType;
          else delete merged.bloodType;
        }
        updated = merged;
        return merged;
      });
      if (!updated) return null;
      await persist(next);
      return updated;
    },
    [contacts, persist],
  );

  const deleteContact = useCallback(
    async (id: string) => {
      await persist(contacts.filter((item) => item.id !== id));
    },
    [contacts, persist],
  );

  const togglePinned = useCallback(
    async (id: string) => {
      const next = contacts.map((item) => {
        if (item.id !== id) return item;
        const merged: ContactProfile = { ...item, updatedAt: new Date().toISOString() };
        if (item.pinned) delete merged.pinned;
        else merged.pinned = true;
        return merged;
      });
      await persist(next);
    },
    [contacts, persist],
  );

  const replaceContacts = useCallback(
    async (nextRaw: ContactProfile[]) => {
      await persist(sanitizeList(nextRaw));
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      contacts,
      loaded,
      getContact,
      findDuplicate,
      addContact,
      updateContact,
      togglePinned,
      deleteContact,
      replaceContacts,
    }),
    [
      contacts,
      loaded,
      getContact,
      findDuplicate,
      addContact,
      updateContact,
      togglePinned,
      deleteContact,
      replaceContacts,
    ],
  );

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider');
  return ctx;
}

export const CONTACT_RELATIONSHIP_OPTIONS: ContactRelationship[] = [
  '연인',
  '친구',
  '가족',
  '동료',
  '기타',
];
