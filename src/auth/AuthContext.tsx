import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PersonId } from '../data/types';
import { DEV_USERS } from './devUsers';

export interface AuthUser {
  id: PersonId;
  name: string;
}

interface AuthValue {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const SESSION_KEY = 'expense-tracker:session';
const AuthCtx = createContext<AuthValue | null>(null);

function readSession(): AuthUser | null {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    const found = DEV_USERS.find((u) => u.person === id);
    return found ? { id: found.person, name: found.name } : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  const login = (username: string, password: string) => {
    const found = DEV_USERS.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password,
    );
    if (!found) return false;
    try {
      sessionStorage.setItem(SESSION_KEY, found.person);
    } catch {
      // Storage blocked: the session lasts for this page only.
    }
    setUser({ id: found.person, name: found.name });
    return true;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthCtx);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
