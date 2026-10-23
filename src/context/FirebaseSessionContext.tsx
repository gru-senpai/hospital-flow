import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { firebaseAuth, firebaseConfigured, firestore } from '../services/firebase';

export type FacilityRole =
  | 'admin'
  | 'coordinator'
  | 'operations'
  | 'nurse'
  | 'housekeeping'
  | 'lab'
  | 'resource_manager'
  | 'pharmacy'
  | 'clinical'
  | 'blood_bank'
  | 'ambulance'
  | 'infection_control'
  | 'viewer';

type FacilityProfile = { facilityId: string; facilityName: string; role: FacilityRole };
type SessionState = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: FacilityProfile | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const FirebaseSessionContext = createContext<SessionState | null>(null);
const validRoles = new Set<FacilityRole>([
  'admin', 'coordinator', 'operations', 'nurse', 'housekeeping', 'lab',
  'resource_manager', 'pharmacy', 'clinical', 'blood_bank', 'ambulance',
  'infection_control', 'viewer',
]);

function parseFacilityProfile(value: unknown): FacilityProfile | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Record<string, unknown>;
  if (
    typeof profile.facilityId !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,64}$/.test(profile.facilityId) ||
    typeof profile.role !== 'string' ||
    !validRoles.has(profile.role as FacilityRole)
  ) return null;

  return {
    facilityId: profile.facilityId,
    facilityName: typeof profile.facilityName === 'string' ? profile.facilityName.slice(0, 100) : 'Hospital facility',
    role: profile.role as FacilityRole,
  };
}

export function FirebaseSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FacilityProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseAuth || !firestore) return;
    const db = firestore;
    let generation = 0;
    return onAuthStateChanged(firebaseAuth, async (nextUser) => {
      const currentGeneration = ++generation;
      setUser(nextUser);
      setProfile(null);
      setProfileError(null);
      if (!nextUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profileSnapshot = await getDoc(doc(db, 'users', nextUser.uid));
        if (currentGeneration !== generation) return;
        if (!profileSnapshot.exists()) {
          setProfileError('Your account is not assigned to a facility. Ask your system administrator to provision your profile.');
          return;
        }
        const parsed = parseFacilityProfile(profileSnapshot.data());
        if (currentGeneration !== generation) return;
        if (!parsed) {
          setProfileError('Your facility access profile is invalid. Contact your system administrator.');
          return;
        }
        setProfile(parsed);
      } catch {
        if (currentGeneration === generation) {
          setProfileError('Could not verify facility access. Check your connection or contact your system administrator.');
        }
      } finally {
        if (currentGeneration === generation) setLoading(false);
      }
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error('Firebase is not configured.');
    await setPersistence(firebaseAuth, browserLocalPersistence);
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  }, []);

  const signOutUser = useCallback(async () => {
    if (firebaseAuth) await signOut(firebaseAuth);
  }, []);

  const value = useMemo(() => ({
    configured: firebaseConfigured,
    loading,
    user,
    profile,
    profileError,
    signIn,
    signOutUser,
  }), [loading, user, profile, profileError, signIn, signOutUser]);

  return <FirebaseSessionContext.Provider value={value}>{children}</FirebaseSessionContext.Provider>;
}

export function useFirebaseSession() {
  const context = useContext(FirebaseSessionContext);
  if (!context) throw new Error('useFirebaseSession must be used within FirebaseSessionProvider.');
  return context;
}
