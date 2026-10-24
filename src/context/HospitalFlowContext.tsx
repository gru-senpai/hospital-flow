import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  HospitalCase,
  CaseStatus,
  WorkflowSettings,
  TurnaroundPriority,
  RejectionReasonCategory,
  EventLog,
} from '../types';
import { photoStorage } from '../services/db';
import {
  loadCases,
  saveCases,
  loadSettings,
  saveSettings,
  getInitialSyntheticCases,
  generateCaseRef,
  generateSyntheticBedPhotoBlob,
} from '../services/storage';

interface HospitalFlowContextType {
  cases: HospitalCase[];
  activeCaseId: string | null;
  activeCase: HospitalCase | null;
  settings: WorkflowSettings;
  storageSummary: {
    totalPhotos: number;
    totalSizeBytes: number;
    pendingCount: number;
    approvedCount: number;
  };
  isProcessing: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  setActiveCaseId: (id: string | null) => void;
  createCase: (params: {
    ward: string;
    room: string;
    bed: string;
    bedType: string;
    priority: TurnaroundPriority;
  }) => HospitalCase;
  toggleNursingHandoff: (caseId: string) => void;
  toggleBillingHandoff: (caseId: string) => void;
  confirmRoomDeparture: (caseId: string) => void;
  startCleaning: (caseId: string) => void;
  claimHousekeepingTask: (caseId: string) => void;
  updateHousekeepingChecklist: (caseId: string, checklist: NonNullable<HospitalCase['housekeepingChecklist']>) => void;
  uploadPhoto: (
    caseId: string,
    file: File | Blob,
    mimeType?: string
  ) => Promise<{ success: boolean; error?: string }>;
  approveBedReady: (caseId: string) => Promise<{ success: boolean; error?: string }>;
  rejectBedPhoto: (
    caseId: string,
    reason: RejectionReasonCategory,
    details?: string
  ) => Promise<{ success: boolean; error?: string }>;
  purgePhotoNow: (caseId: string) => Promise<{ success: boolean; error?: string }>;
  simulateTimeFastForward: (hours: number) => Promise<{ purgedCount: number }>;
  updateSettings: (newSettings: Partial<WorkflowSettings>) => void;
  resetToInitialDemoData: () => Promise<void>;
  refreshStorageSummary: () => Promise<void>;
  clearNotification: () => void;
}

const HospitalFlowContext = createContext<HospitalFlowContextType | undefined>(undefined);

export const HospitalFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<HospitalCase[]>([]);
  const uploadInFlightRef = useRef(new Set<string>());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [settings, setSettings] = useState<WorkflowSettings>(loadSettings);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [storageSummary, setStorageSummary] = useState({
    totalPhotos: 0,
    totalSizeBytes: 0,
    pendingCount: 0,
    approvedCount: 0,
  });

  const showNotification = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      setNotification({ type, message });
    },
    []
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const refreshStorageSummary = useCallback(async () => {
    try {
      const summary = await photoStorage.getStorageSummary();
      setStorageSummary(summary);
    } catch (e) {
      console.warn('[HospitalFlow] Could not fetch storage summary', e);
    }
  }, []);

  // Update cases state and persist to localStorage
  const updateCases = useCallback(
    (updater: (prev: HospitalCase[]) => HospitalCase[]) => {
      setCases((prev) => {
        const next = updater(prev);
        saveCases(next);
        return next;
      });
    },
    []
  );

  // Browser-local cross-tab sync. This is not a shared multi-user backend.
  useEffect(() => {
    const syncCases = (event: StorageEvent) => {
      if (event.key !== 'hospitalflow_cases_v1' || !event.newValue) return;
      try {
        const next = JSON.parse(event.newValue) as HospitalCase[];
        if (Array.isArray(next)) setCases(next);
      } catch (error) {
        console.warn('[HospitalFlow] Could not sync case updates', error);
      }
    };
    window.addEventListener('storage', syncCases);
    return () => window.removeEventListener('storage', syncCases);
  }, []);

  // Periodic and on-load auto-purge check
  const runAutoPurge = useCallback(async () => {
    const now = new Date();
    const { purgedCaseIds, errors } = await photoStorage.purgeExpiredPhotos(now);

    if (errors.length > 0) {
      console.error('[HospitalFlow AutoPurge] Errors occurred during purge:', errors);
      showNotification('error', `Storage purge error: ${errors[0]}`);
    }

    if (purgedCaseIds.length > 0) {
      updateCases((prevCases) =>
        prevCases.map((c) => {
          if (purgedCaseIds.includes(c.id)) {
            const isPending = c.status === 'AWAITING_REVIEW';
            const purgeEvt: EventLog = {
              id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              caseRef: c.caseRef,
              timestamp: new Date().toISOString(),
              type: isPending ? 'PHOTO_EXPIRED' : 'PHOTO_PURGED',
              actorLabel: 'Retention Engine (Auto)',
              summary: isPending
                ? 'Pending-review photo expired (7-day prototype limit exceeded). New photo required.'
                : 'Approved photo permanently purged per 48h retention policy. Approval status preserved.',
            };

            return {
              ...c,
              photoPurged: true,
              photoPurgedAt: new Date().toISOString(),
              // If pending photo expired, bed must have new photo uploaded
              status: isPending ? ('REJECTED_RECLEAN' as CaseStatus) : c.status,
              photoUploaded: isPending ? false : c.photoUploaded,
              events: [purgeEvt, ...c.events],
            };
          }
          return c;
        })
      );

      await refreshStorageSummary();
      showNotification(
        'info',
        `Automated retention policy executed: ${purgedCaseIds.length} expired photo(s) deleted from IndexedDB.`
      );
    }
  }, [refreshStorageSummary, showNotification, updateCases]);

  // Initial load: restore cases from localStorage or seed initial synthetic cases
  useEffect(() => {
    async function init() {
      let loaded = loadCases();
      if (!loaded || loaded.length === 0) {
        loaded = getInitialSyntheticCases();
        saveCases(loaded);

        // Seed initial synthetic photo blob for case 1 and case 3 in IndexedDB
        try {
          const case1Blob = generateSyntheticBedPhotoBlob(loaded[0].caseRef, loaded[0].bed);
          await photoStorage.savePhoto(
            loaded[0].id,
            case1Blob,
            'image/svg+xml',
            loaded[0].photoExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
            'pending'
          );

          const case3Blob = generateSyntheticBedPhotoBlob(loaded[2].caseRef, loaded[2].bed);
          await photoStorage.savePhoto(
            loaded[2].id,
            case3Blob,
            'image/svg+xml',
            loaded[2].photoExpiresAt || new Date(Date.now() + 48 * 3600000).toISOString(),
            'approved'
          );
        } catch (err) {
          console.warn('[HospitalFlow] Seeded synthetic photo storage notice:', err);
        }
      }

      setCases(loaded);
      if (loaded.length > 0) {
        setActiveCaseId(loaded[0].id);
      }

      await runAutoPurge();
      await refreshStorageSummary();
    }

    init();
  }, [runAutoPurge, refreshStorageSummary]);

  // Periodic purge timer
  useEffect(() => {
    const intervalMs = (settings.autoPurgeIntervalSeconds || 30) * 1000;
    const timer = setInterval(() => {
      runAutoPurge();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.autoPurgeIntervalSeconds, runAutoPurge]);

  const activeCase = cases.find((c) => c.id === activeCaseId) || null;

  // 1. Create Case
  const createCase = useCallback(
    ({
      ward,
      room,
      bed,
      bedType,
      priority,
    }: {
      ward: string;
      room: string;
      bed: string;
      bedType: string;
      priority: TurnaroundPriority;
    }): HospitalCase => {
      const caseRef = generateCaseRef();
      const nowIso = new Date().toISOString();

      const newEvt: EventLog = {
        id: `evt-${Date.now()}`,
        caseRef,
        timestamp: nowIso,
        type: 'CASE_CREATED',
        actorLabel: 'Operations',
        summary: `Room readiness workflow opened for ${ward}, ${room}, ${bed} (${bedType})`,
      };

      const newCase: HospitalCase = {
        id: `case-${Date.now()}`,
        caseRef,
        ward,
        room,
        bed,
        bedType,
        priority,
        status: 'HANDOFFS_PENDING',
        createdAt: nowIso,
        nursingComplete: false,
        billingComplete: false,
        departureConfirmed: false,
        cleaningStarted: false,
        photoUploaded: false,
        photoPurged: false,
        events: [newEvt],
      };

      updateCases((prev) => [newCase, ...prev]);
      setActiveCaseId(newCase.id);
      showNotification('success', `Case ${caseRef} created successfully.`);
      return newCase;
    },
    [showNotification, updateCases]
  );

  // 2. Toggle Nursing Handoff
  const toggleNursingHandoff = useCallback(
    (caseId: string) => {
      const nowIso = new Date().toISOString();
      updateCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const nextState = !c.nursingComplete;
          const evt: EventLog = {
            id: `evt-${Date.now()}`,
            caseRef: c.caseRef,
            timestamp: nowIso,
            type: 'NURSING_HANDOFF',
            actorLabel: 'Nursing',
            summary: nextState
              ? 'Nursing handover confirmed: Clinical charts & medications reconciled'
              : 'Nursing handover checklist marked incomplete',
          };
          return {
            ...c,
            nursingComplete: nextState,
            nursingCompletedAt: nextState ? nowIso : undefined,
            events: [evt, ...c.events],
          };
        })
      );
    },
    [updateCases]
  );

  // 3. Toggle Billing / TPA Handoff
  const toggleBillingHandoff = useCallback(
    (caseId: string) => {
      const nowIso = new Date().toISOString();
      updateCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          const nextState = !c.billingComplete;
          const evt: EventLog = {
            id: `evt-${Date.now()}`,
            caseRef: c.caseRef,
            timestamp: nowIso,
            type: 'BILLING_HANDOFF',
            actorLabel: 'Billing / TPA',
            summary: nextState
              ? 'Interim clearance acknowledged (Operational placeholder / TPA pre-auth check)'
              : 'Billing clearance reset to pending',
          };
          return {
            ...c,
            billingComplete: nextState,
            billingCompletedAt: nextState ? nowIso : undefined,
            events: [evt, ...c.events],
          };
        })
      );
    },
    [updateCases]
  );

  // 4. Confirm Room Departure (Starts Housekeeping)
  const confirmRoomDeparture = useCallback(
    (caseId: string) => {
      const nowIso = new Date().toISOString();
      updateCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;
          if (c.departureConfirmed) return c;

          const evt: EventLog = {
            id: `evt-${Date.now()}`,
            caseRef: c.caseRef,
            timestamp: nowIso,
            type: 'ROOM_DEPARTURE',
            actorLabel: 'Operations',
            summary: 'Physical room departure confirmed. Room vacated and released for Housekeeping.',
          };

          return {
            ...c,
            departureConfirmed: true,
            departureConfirmedAt: nowIso,
            status: 'CLEANING_IN_PROGRESS',
            events: [evt, ...c.events],
          };
        })
      );
      showNotification('success', 'Room departure confirmed. Housekeeping notified.');
    },
    [showNotification, updateCases]
  );

  // 5. Housekeeping Starts Cleaning
  const startCleaning = useCallback(
    (caseId: string) => {
      const nowIso = new Date().toISOString();
      updateCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId || !c.departureConfirmed || (c.cleaningStarted && c.status !== 'REJECTED_RECLEAN')) return c;
          const evt: EventLog = {
            id: `evt-${Date.now()}`,
            caseRef: c.caseRef,
            timestamp: nowIso,
            type: 'CLEANING_STARTED',
            actorLabel: 'Housekeeping',
            summary: 'Terminal cleaning, sanitisation, and linen replacement initiated.',
          };
          return {
            ...c,
            cleaningStarted: true,
            cleaningStartedAt: nowIso,
            status: 'CLEANING_IN_PROGRESS',
            events: [evt, ...c.events],
          };
        })
      );
    },
    [updateCases]
  );

  const claimHousekeepingTask = useCallback((caseId: string) => {
    const timestamp = new Date().toISOString();
    updateCases((prev) => prev.map((c) => {
      if (c.id !== caseId || !c.departureConfirmed || c.housekeepingClaimedBy || c.status === 'AWAITING_REVIEW' || c.status === 'BED_READY') return c;
      const event: EventLog = { id: `evt-${Date.now()}`, caseRef: c.caseRef, timestamp, type: 'HOUSEKEEPING_CLAIMED', actorLabel: 'Housekeeping (Demo Operator)', summary: 'Housekeeping task claimed by the demo operator.' };
      return { ...c, housekeepingClaimedBy: 'Housekeeping Demo Operator', housekeepingClaimedAt: timestamp, events: [event, ...c.events] };
    }));
  }, [updateCases]);

  const updateHousekeepingChecklist = useCallback((caseId: string, checklist: NonNullable<HospitalCase['housekeepingChecklist']>) => {
    const timestamp = new Date().toISOString();
    updateCases((prev) => prev.map((c) => {
      if (c.id !== caseId || !c.departureConfirmed || c.status === 'AWAITING_REVIEW' || c.status === 'BED_READY') return c;
      if (JSON.stringify(c.housekeepingChecklist || {}) === JSON.stringify(checklist)) return c;
      const event: EventLog = { id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, caseRef: c.caseRef, timestamp, type: 'HOUSEKEEPING_CHECKLIST', actorLabel: 'Housekeeping (Demo Operator)', summary: 'Housekeeping checklist updated.' };
      return { ...c, housekeepingChecklist: checklist, events: [event, ...c.events] };
    }));
  }, [updateCases]);

  // 6. Housekeeping Uploads Photo
  const uploadPhoto = useCallback(
    async (
      caseId: string,
      file: File | Blob,
      mimeType: string = 'image/jpeg'
    ): Promise<{ success: boolean; error?: string }> => {
      if (uploadInFlightRef.current.has(caseId)) return { success: true };
      const targetCase = cases.find((item) => item.id === caseId);
      if (!targetCase) return { success: false, error: 'Case not found.' };
      if (targetCase.status === 'AWAITING_REVIEW' || targetCase.status === 'BED_READY') return { success: true };
      if (!targetCase.departureConfirmed) return { success: false, error: 'A confirmed room departure is required.' };
      uploadInFlightRef.current.add(caseId);
      setIsProcessing(true);
      try {
        if (file instanceof File) {
          const val = photoStorage.validateFile(file);
          if (!val.valid) {
            setIsProcessing(false);
            showNotification('error', val.error || 'Invalid photo file');
            return { success: false, error: val.error };
          }
          mimeType = file.type;
        }

        // Compute 7-day pending expiry timestamp
        const expiryDays = settings.pendingPhotoExpiryDays || 7;
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
        const nowIso = new Date().toISOString();

        // Save blob in IndexedDB
        const saveRes = await photoStorage.savePhoto(caseId, file, mimeType, expiresAt, 'pending');
        if (!saveRes.success) {
          setIsProcessing(false);
          showNotification('error', `Storage Error: ${saveRes.error || 'Failed to write photo'}`);
          return saveRes;
        }

        // Update case state (strictly no photo bytes or URLs stored in case/events!)
        updateCases((prev) =>
          prev.map((c) => {
            if (c.id !== caseId) return c;
            const evt: EventLog = {
              id: `evt-${Date.now()}`,
              caseRef: c.caseRef,
              timestamp: nowIso,
              type: 'PHOTO_UPLOADED',
              actorLabel: 'Housekeeping',
              summary: 'Room readiness photo captured & uploaded. Case queued for coordinator review.',
            };
            return {
              ...c,
              photoUploaded: true,
              photoUploadedAt: nowIso,
              photoExpiresAt: expiresAt,
              photoPurged: false,
              photoPurgedAt: undefined,
              status: 'AWAITING_REVIEW',
              events: [evt, ...c.events],
            };
          })
        );

        await refreshStorageSummary();
        showNotification('success', 'Photo uploaded. Case is now awaiting coordinator approval.');
        setIsProcessing(false);
        return { success: true };
      } catch (err: unknown) {
        setIsProcessing(false);
        const msg = err instanceof Error ? err.message : 'Unexpected upload failure';
        showNotification('error', msg);
        return { success: false, error: msg };
      } finally {
        uploadInFlightRef.current.delete(caseId);
      }
    },
    [cases, settings.pendingPhotoExpiryDays, showNotification, updateCases, refreshStorageSummary]
  );

  // 7. Coordinator Approves Bed Ready
  const approveBedReady = useCallback(
    async (caseId: string): Promise<{ success: boolean; error?: string }> => {
      const c = cases.find((item) => item.id === caseId);
      if (!c) return { success: false, error: 'Case not found' };

      if (!c.photoUploaded) {
        showNotification('error', 'Cannot approve: Bed photo has not been uploaded yet.');
        return { success: false, error: 'Photo required prior to approval.' };
      }

      setIsProcessing(true);
      try {
        const nowIso = new Date().toISOString();
        const retentionHours = settings.approvedPhotoRetentionHours || 48;
        const expiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000).toISOString();

        // Update photo record retention in IndexedDB
        const updateRes = await photoStorage.updateExpiryAndStatus(caseId, expiresAt, 'approved');
        if (!updateRes.success) {
          console.warn('[HospitalFlow] Retention update notice:', updateRes.error);
        }

        // Case approval event log: Strictly caseRef, approverLabel, approval timestamp, approved status.
        // NO image URLs, file names or binary bytes.
        const approvalNoticeEvt: EventLog = {
          id: `evt-${Date.now()}`,
          caseRef: c.caseRef,
          timestamp: nowIso,
          type: 'APPROVAL_NOTICE',
          actorLabel: 'Coordinator (Simulated)',
          summary: `Bed verified ready for admission. Workflow completed.`,
          details: `Case Ref: ${c.caseRef} | Ward: ${c.ward} | Bed: ${c.bed} | Status: Bed Ready | Approver: Coordinator | Expiry: 48h scheduled deletion`,
        };

        updateCases((prev) =>
          prev.map((item) => {
            if (item.id !== caseId) return item;
            return {
              ...item,
              status: 'BED_READY',
              approvedAt: nowIso,
              approverLabel: 'Coordinator (Simulated)',
              photoExpiresAt: expiresAt,
              events: [approvalNoticeEvt, ...item.events],
            };
          })
        );

        await refreshStorageSummary();
        showNotification('success', `Bed ${c.bed} marked Bed Ready! Photo retention scheduled for 48h.`);
        setIsProcessing(false);
        return { success: true };
      } catch (err: unknown) {
        setIsProcessing(false);
        const msg = err instanceof Error ? err.message : 'Approval failed';
        showNotification('error', msg);
        return { success: false, error: msg };
      }
    },
    [cases, settings.approvedPhotoRetentionHours, showNotification, updateCases, refreshStorageSummary]
  );

  // 8. Coordinator Requests Re-clean / Rejects Photo
  const rejectBedPhoto = useCallback(
    async (
      caseId: string,
      reason: RejectionReasonCategory,
      details?: string
    ): Promise<{ success: boolean; error?: string }> => {
      const c = cases.find((item) => item.id === caseId);
      if (!c) return { success: false, error: 'Case not found' };

      setIsProcessing(true);
      try {
        const nowIso = new Date().toISOString();

        // Rejection MUST delete the rejected image immediately from IndexedDB
        const delRes = await photoStorage.deletePhoto(caseId);
        if (!delRes.success) {
          setIsProcessing(false);
          showNotification('error', `Deletion error: ${delRes.error || 'Failed to remove rejected photo'}`);
          return { success: false, error: delRes.error };
        }

        const reasonLabels: Record<RejectionReasonCategory, string> = {
          LINEN_UNMADE: 'Linen unmade, wrinkled or stained',
          SURFACE_UNCLEAN: 'Surface/floor uncleanness or visible spill',
          TRASH_REMAINS: 'Discarded items / PPE present in room',
          PRIVACY_ISSUE_DETECTED: 'Privacy issue: Person, document, or monitor visible',
          BLURRY_OR_IMPROPER_ANGLE: 'Photo blurry, underexposed, or improper room angle',
          OTHER_OPERATIONAL: 'Other operational deficit',
        };

        const rejEvt: EventLog = {
          id: `evt-${Date.now()}`,
          caseRef: c.caseRef,
          timestamp: nowIso,
          type: 'REJECTION_NOTICE',
          actorLabel: 'Coordinator (Simulated)',
          summary: `Re-clean requested: ${reasonLabels[reason]}. Rejected photo deleted immediately.`,
          details: details ? `Notes: ${details}` : undefined,
        };

        updateCases((prev) =>
          prev.map((item) => {
            if (item.id !== caseId) return item;
            return {
              ...item,
              status: 'REJECTED_RECLEAN',
              housekeepingChecklist: { linenRemoved: false, surfacesDisinfected: false, bedRailsSanitized: false, wasteDisposed: false, fixturesChecked: false },
              photoUploaded: false,
              photoUploadedAt: undefined,
              photoExpiresAt: undefined,
              rejectionReason: reasonLabels[reason],
              rejectionDetails: details,
              rejectedAt: nowIso,
              events: [rejEvt, ...item.events],
            };
          })
        );

        await refreshStorageSummary();
        showNotification(
          'info',
          `Re-clean requested. Rejected image removed from storage. Housekeeping notified.`
        );
        setIsProcessing(false);
        return { success: true };
      } catch (err: unknown) {
        setIsProcessing(false);
        const msg = err instanceof Error ? err.message : 'Rejection failed';
        showNotification('error', msg);
        return { success: false, error: msg };
      }
    },
    [cases, showNotification, updateCases, refreshStorageSummary]
  );

  // 9. Demo-only Control: Delete Photo Now (Test 48h Retention Policy Immediately)
  const purgePhotoNow = useCallback(
    async (caseId: string): Promise<{ success: boolean; error?: string }> => {
      const c = cases.find((item) => item.id === caseId);
      if (!c) return { success: false, error: 'Case not found' };

      setIsProcessing(true);
      try {
        const nowIso = new Date().toISOString();
        const delRes = await photoStorage.deletePhoto(caseId);
        if (!delRes.success) {
          setIsProcessing(false);
          showNotification('error', `Failed to purge photo: ${delRes.error || 'Storage error'}`);
          return { success: false, error: delRes.error };
        }

        const purgeEvt: EventLog = {
          id: `evt-${Date.now()}`,
          caseRef: c.caseRef,
          timestamp: nowIso,
          type: 'PHOTO_PURGED',
          actorLabel: 'Demo Control (Simulated 48h Purge)',
          summary: 'Photo permanently purged via demo retention control. Bed Ready approval notice preserved.',
        };

        updateCases((prev) =>
          prev.map((item) => {
            if (item.id !== caseId) return item;
            return {
              ...item,
              photoPurged: true,
              photoPurgedAt: nowIso,
              events: [purgeEvt, ...item.events],
            };
          })
        );

        await refreshStorageSummary();
        showNotification(
          'success',
          `[Demo Control] Photo for case ${c.caseRef} permanently deleted from IndexedDB. Bed-ready audit notice remains intact.`
        );
        setIsProcessing(false);
        return { success: true };
      } catch (err: unknown) {
        setIsProcessing(false);
        const msg = err instanceof Error ? err.message : 'Purge error';
        showNotification('error', msg);
        return { success: false, error: msg };
      }
    },
    [cases, showNotification, updateCases, refreshStorageSummary]
  );

  // 10. Demo Simulation: Fast-Forward Time
  const simulateTimeFastForward = useCallback(
    async (hours: number): Promise<{ purgedCount: number }> => {
      const simulatedFutureTime = new Date(Date.now() + hours * 3600 * 1000);
      const { purgedCaseIds, errors } = await photoStorage.purgeExpiredPhotos(simulatedFutureTime);

      if (errors.length > 0) {
        showNotification('error', `Fast-forward purge error: ${errors[0]}`);
      }

      if (purgedCaseIds.length > 0) {
        updateCases((prev) =>
          prev.map((c) => {
            if (purgedCaseIds.includes(c.id)) {
              const isPending = c.status === 'AWAITING_REVIEW';
              const evt: EventLog = {
                id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                caseRef: c.caseRef,
                timestamp: new Date().toISOString(),
                type: isPending ? 'PHOTO_EXPIRED' : 'PHOTO_PURGED',
                actorLabel: `Demo Simulation (+${hours}h)`,
                summary: isPending
                  ? `Pending review photo expired under simulated +${hours}h time jump. New photo required.`
                  : `Photo purged per simulated +${hours}h retention period. Approval audit preserved.`,
              };

              return {
                ...c,
                photoPurged: true,
                photoPurgedAt: new Date().toISOString(),
                status: isPending ? ('REJECTED_RECLEAN' as CaseStatus) : c.status,
                photoUploaded: isPending ? false : c.photoUploaded,
                events: [evt, ...c.events],
              };
            }
            return c;
          })
        );
      }

      await refreshStorageSummary();
      showNotification(
        'info',
        `Simulated +${hours} hours: ${purgedCaseIds.length} photo(s) exceeded retention threshold and were purged.`
      );
      return { purgedCount: purgedCaseIds.length };
    },
    [refreshStorageSummary, showNotification, updateCases]
  );

  // 11. Update Settings
  const updateSettings = useCallback((newSettings: Partial<WorkflowSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // 12. Reset to Initial Demo Data
  const resetToInitialDemoData = useCallback(async () => {
    setIsProcessing(true);
    try {
      await photoStorage.clearAllPhotos();
      const freshCases = getInitialSyntheticCases();
      saveCases(freshCases);
      setCases(freshCases);
      setActiveCaseId(freshCases[0].id);

      // Seed synthetic photos
      const case1Blob = generateSyntheticBedPhotoBlob(freshCases[0].caseRef, freshCases[0].bed);
      await photoStorage.savePhoto(
        freshCases[0].id,
        case1Blob,
        'image/svg+xml',
        freshCases[0].photoExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
        'pending'
      );

      const case3Blob = generateSyntheticBedPhotoBlob(freshCases[2].caseRef, freshCases[2].bed);
      await photoStorage.savePhoto(
        freshCases[2].id,
        case3Blob,
        'image/svg+xml',
        freshCases[2].photoExpiresAt || new Date(Date.now() + 48 * 3600000).toISOString(),
        'approved'
      );

      await refreshStorageSummary();
      showNotification('success', 'Demo data reset to clean initial state.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset demo data';
      showNotification('error', msg);
    } finally {
      setIsProcessing(false);
    }
  }, [refreshStorageSummary, showNotification]);

  return (
    <HospitalFlowContext.Provider
      value={{
        cases,
        activeCaseId,
        activeCase,
        settings,
        storageSummary,
        isProcessing,
        notification,
        setActiveCaseId,
        createCase,
        toggleNursingHandoff,
        toggleBillingHandoff,
        confirmRoomDeparture,
        startCleaning,
        claimHousekeepingTask,
        updateHousekeepingChecklist,
        uploadPhoto,
        approveBedReady,
        rejectBedPhoto,
        purgePhotoNow,
        simulateTimeFastForward,
        updateSettings,
        resetToInitialDemoData,
        refreshStorageSummary,
        clearNotification,
      }}
    >
      {children}
    </HospitalFlowContext.Provider>
  );
};

export const useHospitalFlow = () => {
  const context = useContext(HospitalFlowContext);
  if (!context) {
    throw new Error('useHospitalFlow must be used within a HospitalFlowProvider');
  }
  return context;
};
