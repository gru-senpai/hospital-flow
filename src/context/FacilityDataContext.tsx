import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { useFirebaseSession } from './FirebaseSessionContext';
import { firestore } from '../services/firebase';

type DataStatus = { loading: boolean; error: string | null };
type StatusContextValue = {
  statuses: Record<string, DataStatus>;
  setStatus: (key: string, status: DataStatus | null) => void;
};

const FacilityDataStatusContext = createContext<StatusContextValue | null>(null);

export function FacilityDataStatusProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, DataStatus>>({});

  const setStatus = useCallback((key: string, status: DataStatus | null) => {
    setStatuses((current) => {
      if (status === null) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: status };
    });
  }, []);

  const value = useMemo(() => ({ statuses, setStatus }), [statuses, setStatus]);
  return <FacilityDataStatusContext.Provider value={value}>{children}</FacilityDataStatusContext.Provider>;
}

export function useFacilityDataStatus() {
  const context = useContext(FacilityDataStatusContext);
  if (!context) throw new Error('useFacilityDataStatus must be used within FacilityDataStatusProvider.');
  const entries = Object.entries(context.statuses);
  return {
    loading: entries.some(([, status]) => status.loading),
    errors: entries.flatMap(([key, status]) => status.error ? [{ key, message: status.error }] : []),
  };
}

function parseStoredData<T>(value: unknown): T {
  if (Array.isArray(value) || (value !== null && typeof value === 'object')) return value as T;
  throw new Error('The saved workflow data has an unsupported format.');
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected Firebase data error.';
}

export function useFacilityData<T>(
  key: string,
  initialValue: () => T,
): [T, Dispatch<SetStateAction<T>>] {
  const { profile, user } = useFirebaseSession();
  const statusContext = useContext(FacilityDataStatusContext);
  if (!statusContext) throw new Error('useFacilityData must be used within FacilityDataStatusProvider.');

  const [value, setValue] = useState<T>(initialValue);
  const [status, setLocalStatus] = useState<DataStatus>({ loading: true, error: null });
  const initialValueRef = useRef(initialValue);
  const facilityId = profile?.facilityId;
  const setStatus = statusContext.setStatus;
  const documentRef = useMemo<DocumentReference | null>(() => {
    if (!firestore || !facilityId) return null;
    return doc(firestore, 'facilities', facilityId, 'workflows', key);
  }, [key, facilityId]);

  useEffect(() => {
    setStatus(key, status);
    return () => setStatus(key, null);
  }, [key, status, setStatus]);

  useEffect(() => {
    let active = true;

    if (!firestore || !documentRef || !user) {
      setLocalStatus({ loading: false, error: 'Firebase facility data is not available. Check setup and sign in again.' });
      return () => { active = false; };
    }

    const db = firestore;
    const unsubscribe = onSnapshot(documentRef, (snapshot) => {
      if (!active) return;
      if (snapshot.exists()) {
        try {
          const stored = parseStoredData<T>(snapshot.data().data);
          setValue(stored);
          setLocalStatus({ loading: false, error: null });
        } catch (error) {
          setLocalStatus({ loading: false, error: errorMessage(error) });
        }
        return;
      }

      void runTransaction<T>(db, async (transaction) => {
        const current = await transaction.get(documentRef);
        if (current.exists()) return parseStoredData<T>(current.data().data);

        const seed = initialValueRef.current();
        if (!Array.isArray(seed) && (seed === null || typeof seed !== 'object')) {
          throw new Error('Only structured workflow data can be initialized in Firestore.');
        }
        transaction.set(documentRef, {
          data: seed,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
        return seed;
      }).then((seeded) => {
        if (!active) return;
        setValue(seeded);
        setLocalStatus({ loading: false, error: null });
      }).catch((error: unknown) => {
        if (active) setLocalStatus({ loading: false, error: errorMessage(error) });
      });
    }, (error) => {
      if (active) setLocalStatus({ loading: false, error: errorMessage(error) });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [documentRef, user]);

  const update = useCallback<Dispatch<SetStateAction<T>>>((nextValue) => {
    if (!firestore || !documentRef || !user) {
      setLocalStatus({ loading: false, error: 'Cannot save workflow data without an authenticated facility session.' });
      return;
    }

    const db = firestore;
    void runTransaction<T>(db, async (transaction) => {
      const snapshot = await transaction.get(documentRef);
      const current = snapshot.exists()
        ? parseStoredData<T>(snapshot.data().data)
        : initialValueRef.current();
      const next = typeof nextValue === 'function'
        ? (nextValue as (previous: T) => T)(current)
        : nextValue;

      if (!Array.isArray(next) && (next === null || typeof next !== 'object')) {
        throw new Error('Only structured workflow data can be saved in Firestore.');
      }
      transaction.set(documentRef, {
        data: next,
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      return next;
    }).then((next) => {
      setValue(next);
      setLocalStatus({ loading: false, error: null });
    }).catch((error: unknown) => {
      setLocalStatus({ loading: false, error: errorMessage(error) });
    });
  }, [documentRef, user]);

  return [value, update];
}
