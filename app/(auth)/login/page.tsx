'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/common/ThemeToggle';
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
import { DEFAULT_COUNTRY_CODE, toE164 } from '@/lib/account';
import { useI18n, type TranslationKey } from '@/lib/i18n';

type Mode = 'select' | 'email' | 'phone' | 'signup' | 'signupEmail' | 'signupPhone' | 'guest';

const HOME_ROUTE = '/';
const NICKNAME_MAX = 20;

const PARENT_MODE: Record<Mode, Mode> = {
  select: 'select',
  email: 'select',
  phone: 'select',
  signup: 'select',
  signupEmail: 'signup',
  signupPhone: 'signup',
  guest: 'select',
};

const SUBTITLE: Record<Mode, TranslationKey> = {
  select: 'auth_subtitle',
  email: 'auth_email',
  phone: 'auth_phone',
  signup: 'auth_signup_subtitle',
  signupEmail: 'auth_signup_email',
  signupPhone: 'auth_signup_phone',
  guest: 'auth_guest_subtitle',
};

const ERROR_MESSAGES: Record<string, TranslationKey> = {
  'auth/email-already-in-use': 'auth_error_account_exists',
  'auth/invalid-credential': 'auth_error_invalid_login',
  'auth/wrong-password': 'auth_error_invalid_login',
  'auth/user-not-found': 'auth_error_invalid_login',
  'auth/invalid-email': 'auth_error_invalid_email',
  'auth/invalid-phone-number': 'auth_error_phone_invalid',
  'auth/weak-password': 'auth_error_password_short',
};

const inputClass =
  'h-11 w-full min-w-0 rounded-xl border border-neon-cyan/25 bg-obsidian/70 px-3.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-neon-cyan focus:shadow-neon-cyan';

function NeonInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/60">{label}</span>
      <input {...rest} className={inputClass} />
    </label>
  );
}

function PhoneNumberInput({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
}: {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/60">{t('auth_phone_label')}</span>
      <div className="flex gap-2">
        <input
          aria-label={t('auth_country_code_label')}
          type="tel"
          inputMode="tel"
          autoComplete="tel-country-code"
          required
          maxLength={5}
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value.replace(/[^\d+]/g, ''))}
          className={`${inputClass} w-20 shrink-0 text-center font-mono`}
        />
        <input
          aria-label={t('auth_phone_label')}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          placeholder={t('auth_phone_placeholder')}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/[^\d\s-]/g, ''))}
          className={`${inputClass} flex-1 font-mono`}
        />
      </div>
    </div>
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

const panelMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2 },
};

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const auth = useFirebaseAuth();
  const [mode, setMode] = useState<Mode>('select');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [showContinue, setShowContinue] = useState(true);

  useEffect(() => {
    router.prefetch(HOME_ROUTE);
  }, [router]);

  const goHome = () => router.replace(HOME_ROUTE);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword('');
    setPasswordConfirm('');
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      const errorCode = (err as { code?: string; message?: string }).code ?? (err as Error).message;
      const known = ERROR_MESSAGES[errorCode];
      setError(known ? t(known) : `${t('auth_error_generic')} (${errorCode})`);
    } finally {
      setBusy(false);
    }
  };

  /** Shared checks for signup screens; returns false (and shows the error) when invalid. */
  const validateNewPassword = () => {
    if (password.length < 6) {
      setError(t('auth_error_password_short'));
      return false;
    }
    if (password !== passwordConfirm) {
      setError(t('auth_error_password_mismatch'));
      return false;
    }
    return true;
  };

  const validatePhone = () => {
    if (toE164(countryCode, phone)) return true;
    setError(t('auth_error_phone_invalid'));
    return false;
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

  const handlePhoneLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    run(async () => {
      await auth.signInWithPhone(countryCode, phone, password);
      goHome();
    });
  };

  const handleEmailSignup = (e: FormEvent) => {
    e.preventDefault();
    if (!validateNewPassword()) return;
    run(async () => {
      await auth.registerWithEmail(email, password);
      goHome();
    });
  };

  const handlePhoneSignup = (e: FormEvent) => {
    e.preventDefault();
    if (!validatePhone() || !validateNewPassword()) return;
    run(async () => {
      await auth.registerWithPhone(countryCode, phone, password);
      goHome();
    });
  };

  const handleGuest = (e: FormEvent) => {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) return setError(t('auth_error_nickname_required'));
    auth.continueAsGuest(name);
    goHome();
  };

  const memberDisabled = !auth.isFirebaseConfigured || busy;
  const submitLabel = (key: TranslationKey) => (busy ? t('auth_processing') : t(key));

  const passwordFields = (isNew: boolean) => (
    <>
      <NeonInput
        label={t('auth_password_label')}
        type="password"
        autoComplete={isNew ? 'new-password' : 'current-password'}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {isNew && (
        <NeonInput
          label={t('auth_password_confirm_label')}
          type="password"
          autoComplete="new-password"
          required
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
      )}
    </>
  );

  const phoneField = (
    <PhoneNumberInput countryCode={countryCode} phone={phone} onCountryCodeChange={setCountryCode} onPhoneChange={setPhone} />
  );

  const emailField = (
    <NeonInput label={t('auth_email_label')} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
  );

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 max-lg:landscape:py-4">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher />
        <ThemeToggle />
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
            <p className="mb-5 text-sm font-semibold text-white/60">{t(SUBTITLE[mode])}</p>

            {!auth.isFirebaseConfigured && (
              <p className="mb-4 flex gap-2 rounded-xl border border-neon-magenta/40 bg-neon-magenta/10 p-3 text-xs leading-relaxed text-neon-magenta">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {t('auth_firebase_missing')}
              </p>
            )}

            {auth.user && showContinue && mode === 'select' && (
              <div className="mb-4 flex flex-col gap-2">
                <NeonButton size="lg" className="w-full" onClick={goHome}>
                  {t('auth_continue_as', { name: auth.displayName })}
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
                <motion.div key="select" {...panelMotion} className="grid gap-2.5 max-lg:landscape:grid-cols-2">
                  <OptionButton icon={<GoogleIcon className="h-5 w-5" />} label={t('auth_google')} onClick={handleGoogle} disabled={memberDisabled} />
                  <OptionButton icon={<MailIcon className="h-5 w-5" />} label={t('auth_email')} onClick={() => switchMode('email')} disabled={memberDisabled} />
                  <OptionButton icon={<PhoneIcon className="h-5 w-5" />} label={t('auth_phone')} onClick={() => switchMode('phone')} disabled={memberDisabled} />
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    disabled={memberDisabled}
                    className="mx-auto flex items-center gap-1.5 py-1 text-sm font-semibold text-neon-purple underline-offset-4 transition-colors hover:text-neon-cyan hover:underline disabled:cursor-not-allowed disabled:opacity-35 max-lg:landscape:col-span-2"
                  >
                    <UserPlusIcon className="h-4 w-4" glow={false} />
                    {t('auth_signup_prompt')}
                  </button>
                  <div className="my-1 flex items-center gap-3 text-[11px] uppercase tracking-widest text-white/30 max-lg:landscape:col-span-2 max-lg:landscape:hidden">
                    <span className="h-px flex-1 bg-white/10" />
                    {t('auth_or')}
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="max-lg:landscape:col-span-2">
                    <OptionButton
                      icon={<GhostIcon className="h-5 w-5" />}
                      label={t('auth_guest')}
                      description={t('auth_guest_desc')}
                      onClick={() => switchMode('guest')}
                      accent="magenta"
                    />
                  </div>
                </motion.div>
              )}

              {mode === 'signup' && (
                <motion.div key="signup" {...panelMotion} className="grid gap-2.5">
                  <OptionButton icon={<MailIcon className="h-5 w-5" />} label={t('auth_signup_email')} onClick={() => switchMode('signupEmail')} disabled={memberDisabled} accent="purple" />
                  <OptionButton icon={<PhoneIcon className="h-5 w-5" />} label={t('auth_signup_phone')} onClick={() => switchMode('signupPhone')} disabled={memberDisabled} accent="purple" />
                </motion.div>
              )}

              {mode === 'email' && (
                <motion.form key="email" onSubmit={handleEmailLogin} {...panelMotion} className="flex flex-col gap-3">
                  {emailField}
                  {passwordFields(false)}
                  <NeonButton type="submit" size="lg" disabled={busy} className="mt-2 w-full">
                    {submitLabel('auth_submit_login')}
                  </NeonButton>
                </motion.form>
              )}

              {mode === 'phone' && (
                <motion.form key="phone" onSubmit={handlePhoneLogin} {...panelMotion} className="flex flex-col gap-3">
                  {phoneField}
                  {passwordFields(false)}
                  <NeonButton type="submit" size="lg" disabled={busy} className="mt-2 w-full">
                    {submitLabel('auth_submit_login')}
                  </NeonButton>
                </motion.form>
              )}

              {mode === 'signupEmail' && (
                <motion.form key="signupEmail" onSubmit={handleEmailSignup} {...panelMotion} className="flex flex-col gap-3">
                  {emailField}
                  {passwordFields(true)}
                  <NeonButton type="submit" size="lg" disabled={busy} className="mt-2 w-full">
                    {submitLabel('auth_submit_register')}
                  </NeonButton>
                </motion.form>
              )}

              {mode === 'signupPhone' && (
                <motion.form key="signupPhone" onSubmit={handlePhoneSignup} {...panelMotion} className="flex flex-col gap-3">
                  {phoneField}
                  {passwordFields(true)}
                  <NeonButton type="submit" size="lg" disabled={busy} className="mt-2 w-full">
                    {submitLabel('auth_submit_register')}
                  </NeonButton>
                </motion.form>
              )}

              {mode === 'guest' && (
                <motion.form key="guest" onSubmit={handleGuest} {...panelMotion} className="flex flex-col gap-3">
                  <NeonInput
                    label={t('auth_guest_nickname_label')}
                    type="text"
                    autoComplete="nickname"
                    autoFocus
                    required
                    maxLength={NICKNAME_MAX}
                    placeholder={t('auth_guest_nickname_placeholder')}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                  <p className="text-[11px] text-white/45">{t('auth_guest_desc')}</p>
                  <NeonButton type="submit" size="lg" className="mt-2 w-full">
                    {t('auth_guest_start')}
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

            {mode !== 'select' && (
              <button
                type="button"
                onClick={() => switchMode(PARENT_MODE[mode])}
                className="mx-auto mt-5 flex items-center gap-1 text-xs text-white/50 hover:text-neon-cyan"
              >
                <ChevronIcon direction="left" className="h-3.5 w-3.5" glow={false} />
                {t('auth_back')}
              </button>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
