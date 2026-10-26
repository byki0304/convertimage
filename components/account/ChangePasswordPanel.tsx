'use client';

import { useState, type FormEvent } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { NeonButton } from '@/components/ui/NeonButton';
import { AlertIcon, LockIcon } from '@/components/ui/NeonIcons';
import { useToast } from '@/components/ui/Toast';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useI18n, type TranslationKey } from '@/lib/i18n';

const MIN_PASSWORD_LENGTH = 6;

const ERROR_KEYS: Record<string, TranslationKey> = {
  'auth/wrong-password': 'password_wrong_current',
  'auth/invalid-credential': 'password_wrong_current',
  'auth/invalid-login-credentials': 'password_wrong_current',
  'auth/too-many-requests': 'password_too_many',
  'auth/weak-password': 'auth_error_password_short',
};

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-white/60">{label}</span>
      <input
        type="password"
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-neon-cyan/25 bg-obsidian/70 px-3.5 text-sm text-white outline-none transition-all focus:border-neon-cyan focus:shadow-neon-cyan"
      />
    </label>
  );
}

export function ChangePasswordPanel() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { hasPasswordProvider, changePassword } = useFirebaseAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < MIN_PASSWORD_LENGTH) return setError(t('auth_error_password_short'));
    if (newPassword !== confirmPassword) return setError(t('auth_error_password_mismatch'));
    if (newPassword === currentPassword) return setError(t('password_same_as_current'));

    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('password_success'), 'success');
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(ERROR_KEYS[code] ? t(ERROR_KEYS[code]) : `${t('auth_error_generic')} (${code || (err as Error).message})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassPanel className="flex flex-col gap-4 p-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-white">
        <LockIcon className="h-5 w-5 text-neon-purple" />
        {t('password_title')}
      </h2>

      {!hasPasswordProvider ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/55">
          {t('password_unavailable')}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <PasswordField label={t('password_current')} value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordField label={t('password_new')} value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordField label={t('password_confirm')} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

          {error && (
            <p role="alert" className="flex gap-2 rounded-xl border border-neon-magenta/40 bg-neon-magenta/10 p-3 text-xs text-neon-magenta">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <NeonButton type="submit" disabled={busy} className="mt-1">
            {busy ? t('auth_processing') : t('password_submit')}
          </NeonButton>
        </form>
      )}
    </GlassPanel>
  );
}
