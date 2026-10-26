import type { User } from 'firebase/auth';

/**
 * Mobile numbers are used purely as login IDs (no SMS verification), so each number is
 * mapped to a Firebase email/password account under this reserved, non-routable domain.
 */
const PHONE_ID_DOMAIN = 'phone.convertimage.app';

export const DEFAULT_COUNTRY_CODE = '+82';

/** Combines "+82" and "10 1234 5678" / "010-1234-5678" into E.164 ("+821012345678"); null when invalid. */
export function toE164(countryCode: string, localNumber: string): string | null {
  const cc = countryCode.replace(/\D/g, '');
  const local = localNumber.replace(/[\s-]/g, '').replace(/^0+/, '');
  if (!/^\d{1,4}$/.test(cc) || !/^\d+$/.test(local)) return null;
  const e164 = `+${cc}${local}`;
  return /^\+\d{8,15}$/.test(e164) ? e164 : null;
}

export function phoneToAccountEmail(e164: string): string {
  return `${e164.slice(1)}@${PHONE_ID_DOMAIN}`;
}

export function accountEmailToPhone(email: string | null | undefined): string | null {
  if (!email?.endsWith(`@${PHONE_ID_DOMAIN}`)) return null;
  return `+${email.slice(0, -PHONE_ID_DOMAIN.length - 1)}`;
}

export type LoginType = 'google' | 'email' | 'phone';

export function getLoginType(user: User): LoginType {
  if (user.providerData.some((p) => p.providerId === 'google.com')) return 'google';
  return accountEmailToPhone(user.email) ? 'phone' : 'email';
}

/** Real contact info for display, hiding the internal phone-ID email. */
export function getAccountIdentity(user: User) {
  const phone = accountEmailToPhone(user.email) ?? user.phoneNumber;
  const email = accountEmailToPhone(user.email) ? null : user.email;
  return { email, phone, label: user.displayName || email || phone || '' };
}
