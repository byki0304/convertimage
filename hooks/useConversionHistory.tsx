'use client';

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getFirebaseDb } from '@/lib/firebase';
import { GUEST_HISTORY_KEY } from '@/lib/session';
import { useFirebaseAuth } from './useFirebaseAuth';
import type { HistoryEntry } from '@/types';

const LOCAL_KEY = GUEST_HISTORY_KEY;
const GUEST_LIMIT = 10;
export const MILEAGE_PER_FILE = 1;
const MEMBER_LIMIT = 50;

export const HISTORY_RETENTION_HOURS = 720;
const RETENTION_MS = HISTORY_RETENTION_HOURS * 60 * 60 * 1000;
const PRUNE_INTERVAL_MS = 10 * 60 * 1000;
const PRUNE_BATCH_SIZE = 400;

interface HistoryContextValue {
  entries: HistoryEntry[];
  totalConversions: number;
  mileage: number;
  isMemberHistory: boolean;
  addEntries: (entries: HistoryEntry[]) => Promise<void>;
  deleteEntries: (ids: string[]) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

function retentionCutoff(): number {
  return Date.now() - RETENTION_MS;
}

function readLocal(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const all = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    const cutoff = retentionCutoff();
    const fresh = all.filter((entry) => entry.convertedAt >= cutoff);
    if (fresh.length !== all.length) writeLocal(fresh);
    return fresh;
  } catch {
    return [];
  }
}

function writeLocal(entries: HistoryEntry[]) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, GUEST_LIMIT)));
}

/**
 * Deletes expired member history oldest-first while the app is open. The Firestore TTL
 * policy on `expireAt` performs the same cleanup server-side for users who never return.
 */
async function pruneMemberHistory(db: Firestore, uid: string) {
  const historyRef = collection(db, 'users', uid, 'history');
  for (;;) {
    const expired = await getDocs(
      query(historyRef, where('convertedAt', '<', retentionCutoff()), orderBy('convertedAt', 'asc'), limit(PRUNE_BATCH_SIZE))
    );
    if (expired.empty) return;
    const batch = writeBatch(db);
    expired.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (expired.size < PRUNE_BATCH_SIZE) return;
  }
}

function todayKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useFirebaseAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [mileage, setMileage] = useState(0);
  const db = getFirebaseDb();
  const isMemberHistory = Boolean(user && db);

  useEffect(() => {
    if (!user || !db) {
      setEntries(readLocal());
      const timer = window.setInterval(() => setEntries(readLocal()), PRUNE_INTERVAL_MS);
      return () => window.clearInterval(timer);
    }

    const prune = () => pruneMemberHistory(db, user.uid).catch((error) => console.error('History prune failed', error));
    prune();
    const timer = window.setInterval(prune, PRUNE_INTERVAL_MS);

    const historyQuery = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('convertedAt', 'desc'),
      limit(MEMBER_LIMIT)
    );
    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        const cutoff = retentionCutoff();
        setEntries(
          snapshot.docs
            .map((d) => {
              const { expireAt: _expireAt, ...data } = d.data();
              return { ...(data as HistoryEntry), id: d.id };
            })
            .filter((entry) => entry.convertedAt >= cutoff)
        );
      },
      (error) => console.error('History subscription failed', error)
    );
    const unsubscribeProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        const data = snapshot.data();
        setMemberTotal((data?.totalConversions as number | undefined) ?? 0);
        setMileage((data?.mileage as number | undefined) ?? 0);
      },
      (error) => console.error('Profile subscription failed', error)
    );
    return () => {
      window.clearInterval(timer);
      unsubscribeHistory();
      unsubscribeProfile();
    };
  }, [user, db, isGuest]);

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
        batch.set(doc(collection(db, 'users', user.uid, 'history')), {
          ...entry,
          uid: user.uid,
          expireAt: Timestamp.fromMillis(entry.convertedAt + RETENTION_MS),
        });
        counts[entry.toFormat] = (counts[entry.toFormat] ?? 0) + 1;
      }
      const formatCounts = Object.fromEntries(
        Object.entries(counts).map(([format, count]) => [format, increment(count)])
      );
      batch.set(
        doc(db, 'users', user.uid),
        {
          totalConversions: increment(newEntries.length),
          mileage: increment(newEntries.length * MILEAGE_PER_FILE),
          updatedAt: serverTimestamp(),
        },
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

  const deleteEntries = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const targets = new Set(ids);
      if (!user || !db) {
        const next = readLocal().filter((entry) => !targets.has(entry.id));
        writeLocal(next);
        setEntries(next);
        return;
      }
      const batch = writeBatch(db);
      for (const id of targets) batch.delete(doc(db, 'users', user.uid, 'history', id));
      await batch.commit();
    },
    [user, db]
  );

  const value = useMemo(
    () => ({
      entries,
      totalConversions: isMemberHistory ? memberTotal : entries.length,
      mileage: isMemberHistory ? mileage : 0,
      isMemberHistory,
      addEntries,
      deleteEntries,
    }),
    [entries, isMemberHistory, memberTotal, mileage, addEntries, deleteEntries]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useConversionHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useConversionHistory must be used within HistoryProvider');
  return ctx;
}
