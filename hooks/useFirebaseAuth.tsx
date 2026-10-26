'use client';

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAccountIdentity, getLoginType, phoneToAccountEmail, toE164 } from '@/lib/account';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebase';
import { useI18n } from '@/lib/i18n';
import { clearGuestData, getGuestNickname, isGuestSession, startGuestSession } from '@/lib/session';
import { useSettings } from '@/lib/settings';
import { LOCALES, TARGET_FORMATS, type Locale, type TargetFormat } from '@/types';

interface AuthContextValue {
  user: User | null;
  isGuest: boolean;
  /** Nickname for guests, otherwise the member's name / email / mobile number. */
  displayName: string;
  isReady: boolean;
  isAuthenticated: boolean;
  isFirebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  signInWithPhone: (countryCode: string, phoneNumber: string, password: string) => Promise<void>;
  registerWithPhone: (countryCode: string, phoneNumber: string, password: string) => Promise<void>;
  hasPasswordProvider: boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  continueAsGuest: (nickname: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('auth/firebase-not-configured');
  return auth;
}

function phoneAccountEmail(countryCode: string, phoneNumber: string): string {
  const e164 = toE164(countryCode, phoneNumber);
  if (!e164) throw new Error('auth/invalid-phone-number');
  return phoneToAccountEmail(e164);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useI18n();
  const { preferredFormat, setPreferredFormat } = useSettings();
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestNickname, setGuestNickname] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [profileLoadedFor, setProfileLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    setIsGuest(isGuestSession());
    setGuestNickname(getGuestNickname());
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsReady(true);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser && isGuestSession()) {
        clearGuestData();
        setIsGuest(false);
        setGuestNickname(null);
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
          const identity = getAccountIdentity(user);
          await setDoc(ref, {
            uid: user.uid,
            email: identity.email,
            phoneNumber: identity.phone,
            displayName: user.displayName,
            loginType: getLoginType(user),
            preferredLanguage: locale,
            preferredFormat,
            totalConversions: 0,
            mileage: 0,
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
    await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  }, []);

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
  }, []);

  const signInWithPhone = useCallback(async (countryCode: string, phoneNumber: string, password: string) => {
    await signInWithEmailAndPassword(requireAuth(), phoneAccountEmail(countryCode, phoneNumber), password);
  }, []);

  const registerWithPhone = useCallback(async (countryCode: string, phoneNumber: string, password: string) => {
    await createUserWithEmailAndPassword(requireAuth(), phoneAccountEmail(countryCode, phoneNumber), password);
  }, []);

  /** Firebase rejects password updates on stale sessions, so the current password is re-verified first. */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const currentUser = requireAuth().currentUser;
    if (!currentUser?.email) throw new Error('auth/no-password-provider');
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  }, []);

  const continueAsGuest = useCallback((nickname: string) => {
    startGuestSession(nickname);
    setGuestNickname(nickname);
    setIsGuest(true);
  }, []);

  const logout = useCallback(async () => {
    clearGuestData();
    setIsGuest(false);
    setGuestNickname(null);
    setProfileLoadedFor(null);
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isGuest,
      displayName: user ? getAccountIdentity(user).label : guestNickname ?? '',
      isReady,
      isAuthenticated: Boolean(user) || isGuest,
      isFirebaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      signInWithPhone,
      registerWithPhone,
      hasPasswordProvider: Boolean(user?.providerData.some((p) => p.providerId === 'password')),
      changePassword,
      continueAsGuest,
      logout,
    }),
    [user, isGuest, guestNickname, isReady, signInWithGoogle, signInWithEmail, registerWithEmail, signInWithPhone, registerWithPhone, changePassword, continueAsGuest, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within AuthProvider');
  return ctx;
}
