import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { PersonId } from '../data/types';
import { auth, db, HOUSEHOLD } from '../lib/firebase';
import { PEOPLE } from '../lib/labels';

export interface AuthUser {
  id: PersonId;
  name: string;
}

interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthValue | null>(null);

// A signed-in login is only allowed in if it has a member record in the household.
async function findMember(uid: string): Promise<AuthUser | null> {
  const snap = await getDoc(doc(db, `${HOUSEHOLD}/members/${uid}`));
  if (!snap.exists()) return null;
  const person = snap.data().person as PersonId;
  return { id: person, name: PEOPLE[person] };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (fbUser: User | null) => {
        if (!fbUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        const member = await findMember(fbUser.uid).catch(() => null);
        if (!member) {
          // Signed in, but not one of the two household accounts.
          await signOut(auth);
          setUser(null);
        } else {
          setUser(member);
        }
        setLoading(false);
      }),
    [],
  );

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return null;
    } catch {
      return 'Wrong email or password';
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthCtx);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
