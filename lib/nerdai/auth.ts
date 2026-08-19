import type { NerdUser, AuthSession, UserRole } from './types';
import {
  getUsers, saveUsers, getSession, saveSession, clearSession,
} from './store';

const ADMIN_USERNAME = 'spritx';
const ADMIN_PASSWORD = 'Porahoto@#1981@#';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(username: string, password: string): Promise<AuthSession | null> {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const session: AuthSession = {
      userId: 'admin',
      username: ADMIN_USERNAME,
      role: 'admin',
      token: generateToken(),
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    saveSession(session);
    return session;
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user || !user.active) return null;

  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return null;

  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    token: generateToken(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  saveSession(session);
  return session;
}

export function logout(): void {
  clearSession();
}

export function getCurrentSession(): AuthSession | null {
  return getSession();
}

export async function createUser(
  username: string,
  password: string,
  role: UserRole = 'user'
): Promise<NerdUser> {
  const users = getUsers();
  const passwordHash = await hashPassword(password);
  const newUser: NerdUser = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    role,
    assignedModels: [],
    createdAt: Date.now(),
    active: true,
  };
  saveUsers([...users, newUser]);
  return newUser;
}

export function deleteUser(userId: string): void {
  const users = getUsers().filter(u => u.id !== userId);
  saveUsers(users);
}

export function toggleUserActive(userId: string): void {
  const users = getUsers().map(u =>
    u.id === userId ? { ...u, active: !u.active } : u
  );
  saveUsers(users);
}

export function updateUserModels(userId: string, modelIds: string[]): void {
  const users = getUsers().map(u =>
    u.id === userId ? { ...u, assignedModels: modelIds } : u
  );
  saveUsers(users);
}
