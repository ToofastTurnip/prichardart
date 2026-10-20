import type { RepoConfig } from "@/lib/github";

const KEY = "prichard-studio-session";

export interface StoredSession {
  token: string;
  repo: RepoConfig;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession, remember: boolean) {
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  } catch {}
}
