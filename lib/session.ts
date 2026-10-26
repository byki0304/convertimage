export const INTRO_COOKIE = 'ci_intro_seen';
const GUEST_KEY = 'ci_guest_session';
const GUEST_NICKNAME_KEY = 'ci_guest_nickname';
export const GUEST_HISTORY_KEY = 'ci_history';

/** Session cookie (no expiry) so the intro replays on every new browser session. */
export function markIntroSeen() {
  document.cookie = `${INTRO_COOKIE}=1; path=/; SameSite=Lax`;
}

export function isGuestSession(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(GUEST_KEY) === '1';
}

export function getGuestNickname(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(GUEST_NICKNAME_KEY);
}

export function startGuestSession(nickname: string) {
  clearGuestData();
  window.sessionStorage.setItem(GUEST_KEY, '1');
  window.sessionStorage.setItem(GUEST_NICKNAME_KEY, nickname);
}

/** Removes every trace of a guest session, including its conversion history. */
export function clearGuestData() {
  window.sessionStorage.removeItem(GUEST_KEY);
  window.sessionStorage.removeItem(GUEST_NICKNAME_KEY);
  window.localStorage.removeItem(GUEST_HISTORY_KEY);
}
