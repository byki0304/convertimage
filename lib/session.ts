export const INTRO_COOKIE = 'ci_intro_seen';
const GUEST_KEY = 'ci_guest_session';

/** Session cookie (no expiry) so the intro replays on every new browser session. */
export function markIntroSeen() {
  document.cookie = `${INTRO_COOKIE}=1; path=/; SameSite=Lax`;
}

export function isGuestSession(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(GUEST_KEY) === '1';
}

export function setGuestSession(active: boolean) {
  if (active) window.sessionStorage.setItem(GUEST_KEY, '1');
  else window.sessionStorage.removeItem(GUEST_KEY);
}
