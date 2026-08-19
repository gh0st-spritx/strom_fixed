import type { NerdUser, NerdModel, AuthSession, NerdAISettings, ChatSession } from './types';

const KEYS = {
  users: 'nerdai_users',
  models: 'nerdai_models',
  session: 'nerdai_session',
  settings: 'nerdai_settings',
  chats: (userId: string) => `nerdai_chats_${userId}`,
};

const DEFAULT_SETTINGS: NerdAISettings = {
  systemName: 'NerdAI',
  welcomeMessage: 'Welcome to NerdAI. How can I assist you?',
  allowRegistration: false,
  defaultSystemPrompt: 'You are NerdAI, a powerful and precise AI assistant.',
};

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function getUsers(): NerdUser[] {
  return safeGet<NerdUser[]>(KEYS.users) ?? [];
}

export function saveUsers(users: NerdUser[]): void {
  safeSet(KEYS.users, users);
}

export function getModels(): NerdModel[] {
  return safeGet<NerdModel[]>(KEYS.models) ?? [];
}

export function saveModels(models: NerdModel[]): void {
  safeSet(KEYS.models, models);
}

export function getChats(userId: string): ChatSession[] {
  return safeGet<ChatSession[]>(KEYS.chats(userId)) ?? [];
}

export function saveChats(userId: string, chats: ChatSession[]): void {
  safeSet(KEYS.chats(userId), chats);
}

export function getSession(): AuthSession | null {
  const session = safeGet<AuthSession>(KEYS.session);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    clearSession();
    return null;
  }
  return session;
}

export function saveSession(session: AuthSession): void {
  safeSet(KEYS.session, session);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.session);
}

export function getSettings(): NerdAISettings {
  return safeGet<NerdAISettings>(KEYS.settings) ?? { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: NerdAISettings): void {
  safeSet(KEYS.settings, settings);
}
