'use client';

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { useI18n } from '@/lib/i18n';
import { isGuestSession, setGuestSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';
import { LOCALES, TARGET_FORMATS, type Locale, type TargetFormat } from '@/types';

interface AuthContextValue {
  user: User | null;
  isGuest: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  isFirebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  sendPhoneCode: (phoneNumber: string, recaptchaContainerId: string) => Promise<void>;
  verifyPhoneCode: (code: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('auth/firebase-not-configured');
  return auth;
}

/** Converts local Korean numbers (010-1234-5678) into E.164 (+821012345678). */
export function toE164(phoneNumber: string): string {
  const trimmed = phoneNumber.replace(/[\s-()]/g, '');
  if (trimmed.startsWith('+')) return trimmed;
  if (trimmed.startsWith('0')) return `+82${trimmed.slice(1)}`;
  return `+82${trimmed}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useI18n();
  const { preferredFormat, setPreferredFormat } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    setIsGuest(isGuestSession());
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsReady(true);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        setGuestSession(false);
        setIsGuest(false);
      }
      setIsReady(true);
    });
  }, []);

  // Pull the member's saved preferences once per sign-in, creating the profile on first login.
  useEffect(() => {
    const db = getFirebaseDb();
    if (!user || !db || profileLoadedFor === user.uid) return;
    let cancelled = false;
    (async () => {
      const ref = doc(db, 'users', user.uid);
      try {
        const snapshot = await getDoc(ref);
        if (cancelled) return;
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (LOCALES.includes(data.preferredLanguage)) setLocale(data.preferredLanguage as Locale);
          if (TARGET_FORMATS.includes(data.preferredFormat)) setPreferredFormat(data.preferredFormat as TargetFormat);
        } else {
          await setDoc(ref, {
            uid: user.uid,
            email: user.email,
            phoneNumber: user.phoneNumber,
            displayName: user.displayName,
            preferredLanguage: locale,
            preferredFormat,
            totalConversions: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
      if (!cancelled) setProfileLoadedFor(user.uid);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profileLoadedFor]);

  // Push preference changes back to Firestore, but only after the remote profile has been applied.
  useEffect(() => {
    const db = getFirebaseDb();
    if (!user || !db || profileLoadedFor !== user.uid) return;
    setDoc(
      doc(db, 'users', user.uid),
      { preferredLanguage: locale, preferredFormat, updatedAt: serverTimestamp() },
      { merge: true }
    ).catch((error) => console.error('Failed to sync preferences', error));
  }, [user, profileLoadedFor, locale, preferredFormat]);

  const signInWithGoogle = useCallback(async () => {
    const auth = requireAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(requireAuth(), email, password);
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
    if (displayName) await updateProfile(credential.user, { displayName });
  }, []);

  const sendPhoneCode = useCallback(async (phoneNumber: string, recaptchaContainerId: string) => {
    const auth = requireAuth();
    auth.languageCode = locale;
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
    }
    try {
      confirmationRef.current = await signInWithPhoneNumber(auth, toE164(phoneNumber), recaptchaRef.current);
    } catch (error) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
      throw error;
    }
  }, [locale]);

  const verifyPhoneCode = useCallback(async (code: string) => {
    if (!confirmationRef.current) throw new Error('auth/missing-verification-id');
    await confirmationRef.current.confirm(code);
    confirmationRef.current = null;
  }, []);

  const continueAsGuest = useCallback(() => {
    setGuestSession(true);
    setIsGuest(true);
  }, []);

  const logout = useCallback(async () => {
    setGuestSession(false);
    setIsGuest(false);
    setProfileLoadedFor(null);
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isGuest,
      isReady,
      isAuthenticated: Boolean(user) || isGuest,
      isFirebaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      sendPhoneCode,
      verifyPhoneCode,
      continueAsGuest,
      logout,
    }),
    [user, isGuest, isReady, signInWithGoogle, signInWithEmail, registerWithEmail, sendPhoneCode, verifyPhoneCode, continueAsGuest, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within AuthProvider');
  return ctx;
}
