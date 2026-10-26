'use client';

import {
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getFirebaseDb } from '@/lib/firebase';
import { useFirebaseAuth } from './useFirebaseAuth';
import type { HistoryEntry } from '@/types';

const LOCAL_KEY = 'ci_history';
const GUEST_LIMIT = 10;
const MEMBER_LIMIT = 50;

interface HistoryContextValue {
  entries: HistoryEntry[];
  totalConversions: number;
  isMemberHistory: boolean;
  addEntries: (entries: HistoryEntry[]) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

function readLocal(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(entries: HistoryEntry[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, GUEST_LIMIT)));
}

function todayKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useFirebaseAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const db = getFirebaseDb();
  const isMemberHistory = Boolean(user && db);

  useEffect(() => {
    if (!user || !db) {
      setEntries(readLocal());
      return;
    }
    const historyQuery = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('convertedAt', 'desc'),
      limit(MEMBER_LIMIT)
    );
    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (snapshot) => setEntries(snapshot.docs.map((d) => ({ ...(d.data() as HistoryEntry), id: d.id }))),
      (error) => console.error('History subscription failed', error)
    );
    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => setMemberTotal((snapshot.data()?.totalConversions as number | undefined) ?? 0),
      (error) => console.error('Profile subscription failed', error)
    );
    return () => {
      unsubscribeHistory();
      unsubscribeProfile();
    };
  }, [user, db]);

  const addEntries = useCallback(
    async (newEntries: HistoryEntry[]) => {
      if (newEntries.length === 0) return;

      if (!user || !db) {
        const next = [...newEntries, ...readLocal()].slice(0, GUEST_LIMIT);
        writeLocal(next);
        setEntries(next);
        return;
      }

      const batch = writeBatch(db);
      const counts: Record<string, number> = {};
      for (const entry of newEntries) {
        batch.set(doc(collection(db, 'users', user.uid, 'history')), { ...entry, uid: user.uid });
        counts[entry.toFormat] = (counts[entry.toFormat] ?? 0) + 1;
      }
      const formatCounts = Object.fromEntries(
        Object.entries(counts).map(([format, count]) => [format, increment(count)])
      );
      batch.set(
        doc(db, 'users', user.uid),
        { totalConversions: increment(newEntries.length), updatedAt: serverTimestamp() },
        { merge: true }
      );
      batch.set(
        doc(db, 'stats', todayKey()),
        { total: increment(newEntries.length), ...formatCounts, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await batch.commit();
    },
    [user, db]
  );

  const clearHistory = useCallback(async () => {
    if (!user || !db) {
      writeLocal([]);
      setEntries([]);
      return;
    }
    const batch = writeBatch(db);
    for (const entry of entries) batch.delete(doc(db, 'users', user.uid, 'history', entry.id));
    await batch.commit();
  }, [user, db, entries]);

  const value = useMemo(
    () => ({
      entries,
      totalConversions: isMemberHistory ? memberTotal : entries.length,
      isMemberHistory,
      addEntries,
      clearHistory,
    }),
    [entries, isMemberHistory, memberTotal, addEntries, clearHistory]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useConversionHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useConversionHistory must be used within HistoryProvider');
  return ctx;
}
