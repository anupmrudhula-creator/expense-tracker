// DEV ONLY. Two local accounts so the UI can be exercised before Firebase Auth is wired up.
// Plain-text on purpose for now; this file is removed when Firebase Auth replaces AuthContext.
import type { PersonId } from '../data/types';

export interface DevUser {
  username: string;
  password: string;
  person: PersonId;
  name: string;
}

export const DEV_USERS: DevUser[] = [
  { username: 'anup', password: 'anup-dev-123', person: 'anup', name: 'Anup' },
  { username: 'mrudhula', password: 'mrudhula-dev-123', person: 'mrudhula', name: 'Mrudhula' },
];
