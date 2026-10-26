'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Logo } from '@/components/ui/Logo';
import { NeonButton } from '@/components/ui/NeonButton';
import {
  AlertIcon,
  ChevronIcon,
  GhostIcon,
  GoogleIcon,
  MailIcon,
  PhoneIcon,
  UserPlusIcon,
} from '@/components/ui/NeonIcons';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useI18n } from '@/lib/i18n';

type Mode = 'select' | 'email' | 'register' | 'phone';

const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';
const HOME_ROUTE = '/';

function NeonInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/60">{label}</span>
      <input
        {...rest}
        className="h-11 rounded-xl border border-neon-cyan/25 bg-obsidian/70 px-3.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-neon-cyan focus:shadow-neon-cyan"
      />
    </label>
  );
}

function OptionButton({
  icon,
  label,
  description,
  onClick,
  disabled,
  accent = 'cyan',
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: 'cyan' | 'magenta' | 'purple';
}) {
  const accentClass = {
    cyan: 'border-neon-cyan/30 hover:border-neon-cyan hover:shadow-neon-cyan text-neon-cyan',
    magenta: 'border-neon-magenta/30 hover:border-neon-magenta hover:shadow-neon-magenta text-neon-magenta',
    purple: 'border-neon-purple/40 hover:border-neon-purple hover:shadow-neon-purple text-neon-purple',
  }[accent];

  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { x: 3 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-center gap-3 rounded-xl border bg-obsidian-card/70 px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none ${accentClass}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-white">{label}</span>
        {description && <span className="block truncate text-[11px] text-white/45">{description}</span>}
      </span>
      <ChevronIcon className="h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
    </motion.button>
  );
}

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const auth = useFirebaseAuth();
  const [mode, setMode] = useState<Mode>('select');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [showContinue, setShowContinue] = useState(true);

  useEffect(() => {
    router.prefetch(HOME_ROUTE);
  }, [router]);

  const goHome = () => router.replace(HOME_ROUTE);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      const errorCode = (err as { code?: string; message?: string }).code ?? (err as Error).message;
      setError(`${t('auth_error_generic')} (${errorCode})`);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () =>
    run(async () => {
      await auth.signInWithGoogle();
      goHome();
    });

  const handleEmailLogin = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await auth.signInWithEmail(email, password);
      goHome();
    });
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError(t('auth_error_password_short'));
    if (password !== passwordConfirm) return setError(t('auth_error_password_mismatch'));
    run(async () => {
      await auth.registerWithEmail(email, password, displayName);
      goHome();
    });
  };

  const handlePhone = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (!codeSent) {
        await auth.sendPhoneCode(phone, RECAPTCHA_CONTAINER_ID);
        setCodeSent(true);
        setNotice(t('auth_code_sent'));
      } else {
        await auth.verifyPhoneCode(code);
        goHome();
      }
    });
  };

  const handleGuest = () => {
    auth.continueAsGuest();
    goHome();
  };

  const memberDisabled = !auth.isFirebaseConfigured || busy;
  const signedInName = auth.user?.displayName || auth.user?.email || auth.user?.phoneNumber;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 max-lg:landscape:py-4">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md max-lg:landscape:max-w-2xl"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center max-lg:landscape:mb-3">
          <Logo size="lg" href="/login" />
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">{t('app_tagline')}</p>
        </div>

        <GlassPanel className="relative overflow-hidden p-6 shadow-neon-purple sm:p-8 max-lg:landscape:p-5">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-neon-magenta/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-neon-cyan/15 blur-3xl" />

          <div className="relative">
            <h1 className="neon-text text-2xl font-extrabold">{t('auth_title')}</h1>
            <p className="mb-5 mt-1 text-sm text-white/50">{t('auth_subtitle')}</p>

            {!auth.isFirebaseConfigured && (
              <p className="mb-4 flex gap-2 rounded-xl border border-neon-magenta/40 bg-neon-magenta/10 p-3 text-xs leading-relaxed text-neon-magenta">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {t('auth_firebase_missing')}
              </p>
            )}

            {auth.user && showContinue && mode === 'select' && (
              <div className="mb-4 flex flex-col gap-2">
                <NeonButton size="lg" className="w-full" onClick={goHome}>
                  {t('auth_continue_as', { name: signedInName ?? '' })}
                </NeonButton>
                <button
                  type="button"
                  onClick={async () => {
                    await auth.logout();
                    setShowContinue(false);
                  }}
                  className="text-xs text-white/50 underline-offset-4 hover:text-neon-cyan hover:underline"
                >
                  {t('auth_switch_account')}
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-2.5 max-lg:landscape:grid-cols-2"
                >
                  <OptionButton icon={<GoogleIcon className="h-5 w-5" />} label={t('auth_google')} onClick={handleGoogle} disabled={memberDisabled} />
                  <OptionButton icon={<MailIcon className="h-5 w-5" />} label={t('auth_email')} onClick={() => switchMode('email')} disabled={memberDisabled} />
                  <OptionButton icon={<PhoneIcon className="h-5 w-5" />} label={t('auth_phone')} onClick={() => switchMode('phone')} disabled={memberDisabled} />
                  <OptionButton icon={<UserPlusIcon className="h-5 w-5" />} label={t('auth_register')} onClick={() => switchMode('register')} disabled={memberDisabled} accent="purple" />
                  <div className="my-1 flex items-center gap-3 text-[11px] uppercase tracking-widest text-white/30 max-lg:landscape:col-span-2 max-lg:landscape:hidden">
                    <span className="h-px flex-1 bg-white/10" />
                    {t('auth_or')}
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <OptionButton icon={<GhostIcon className="h-5 w-5" />} label={t('auth_guest')} description={t('auth_guest_desc')} onClick={handleGuest} accent="magenta" />
                </motion.div>
              )}

              {mode === 'email' && (
                <motion.form
                  key="email"
                  onSubmit={handleEmailLogin}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  <NeonInput label={t('auth_email_label')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  <NeonInput label={t('auth_password_label')} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <NeonButton type="submit" size="lg" disabled={busy} className="mt-2 w-full">
                    {busy ? t('auth_processing') : t('auth_submit_login')}
                  </NeonButton>
                </motion.form>
              )}

              {mode === 'register' && (
                <motion.form
                  key="register"
                  onSubmit={handleRegister}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  <NeonInput label={t('auth_display_name_label')} type="text" autoComplete="nickname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  <NeonInput label={t('auth_email_label')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  <NeonInput label={t('auth_password_label')} type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  <NeonInput label={t('auth_password_confirm_label')} type="password" autoComplete="new-password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
                  <NeonButton type="submit" size="lg" disabled={busy} className="mt-2 w-full">
                    {busy ? t('auth_processing') : t('auth_submit_register')}
                  </NeonButton>
                </motion.form>
              )}

              {mode === 'phone' && (
                <motion.form
                  key="phone"
                  onSubmit={handlePhone}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  <NeonInput
                    label={`${t('auth_phone_label')} (+82)`}
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder={t('auth_phone_placeholder')}
                    value={phone}
                    disabled={codeSent}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  {codeSent && (
                    <NeonInput
                      label={t('auth_code_label')}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    />
                  )}
                  <NeonButton type="submit" size="lg" disabled={busy} className="mt-2 w-full">
                    {busy ? t('auth_processing') : codeSent ? t('auth_verify_code') : t('auth_send_code')}
                  </NeonButton>
                </motion.form>
              )}
            </AnimatePresence>

            {error && (
              <p role="alert" className="mt-4 flex gap-2 rounded-xl border border-neon-magenta/40 bg-neon-magenta/10 p-3 text-xs text-neon-magenta">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            {notice && !error && <p className="mt-4 text-center text-xs text-neon-cyan">{notice}</p>}

            {mode !== 'select' && (
              <button
                type="button"
                onClick={() => {
                  switchMode('select');
                  setCodeSent(false);
                  setCode('');
                }}
                className="mx-auto mt-5 flex items-center gap-1 text-xs text-white/50 hover:text-neon-cyan"
              >
                <ChevronIcon direction="left" className="h-3.5 w-3.5" glow={false} />
                {t('auth_back')}
              </button>
            )}
          </div>
        </GlassPanel>
      </motion.div>

      <div id={RECAPTCHA_CONTAINER_ID} />
    </div>
  );
}
