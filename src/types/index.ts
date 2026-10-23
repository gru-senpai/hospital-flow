export type CaseStatus =
  | 'HANDOFFS_PENDING'        // Nursing / Billing handoffs incomplete or awaiting room departure
  | 'CLEANING_IN_PROGRESS'    // Departure confirmed, Housekeeping is cleaning
  | 'AWAITING_REVIEW'         // Photo uploaded by Housekeeping, awaiting Coordinator approval
  | 'BED_READY'               // Approved by Coordinator, workflow closed
  | 'REJECTED_RECLEAN';       // Rejection requested, re-cleaning required

export type TurnaroundPriority = 'NORMAL' | 'URGENT' | 'HIGH_TURNOVER';

export interface EventLog {
  id: string;
  caseRef: string;
  timestamp: string;
  type:
    | 'CASE_CREATED'
    | 'NURSING_HANDOFF'
    | 'BILLING_HANDOFF'
    | 'ROOM_DEPARTURE'
    | 'CLEANING_STARTED'
    | 'PHOTO_UPLOADED'
    | 'APPROVAL_NOTICE'
    | 'REJECTION_NOTICE'
    | 'PHOTO_PURGED'
    | 'PHOTO_EXPIRED';
  actorLabel: string; // e.g. "Operations", "Nursing", "Billing / TPA", "Housekeeping", "Coordinator (Simulated)"
  summary: string;
  details?: string;
  // NOTE: Strictly NO image URLs, file names, or image bytes in event logs!
}

export interface HospitalCase {
  id: string;
  caseRef: string; // Synthetic reference, e.g. "HF-4182"
  ward: string;    // Operational ward label, e.g. "Ward 4B (Stepdown)"
  room: string;    // Room label, e.g. "Room 408"
  bed: string;     // Bed label, e.g. "Bed 1"
  bedType: string; // e.g. "Standard Ward Bed", "ICU Stepdown", "Isolation"
  priority: TurnaroundPriority;
  status: CaseStatus;
  createdAt: string;

  // Step 1: Handoffs
  nursingComplete: boolean;
  nursingCompletedAt?: string;
  billingComplete: boolean;
  billingCompletedAt?: string;

  // Step 2: Room Departure
  departureConfirmed: boolean;
  departureConfirmedAt?: string;

  // Step 3: Housekeeping Cleaning
  cleaningStarted: boolean;
  cleaningStartedAt?: string;

  // Step 4: Housekeeping Photo & Review
  photoUploaded: boolean;
  photoUploadedAt?: string;
  photoExpiresAt?: string; // ISO string: 7 days for pending review, 48 hours once approved
  photoPurged: boolean;
  photoPurgedAt?: string;

  // Step 5: Approval / Rejection
  approvedAt?: string;
  approverLabel?: string; // "Coordinator (Simulated)"
  rejectionReason?: string;
  rejectionDetails?: string;
  rejectedAt?: string;

  // Audit history
  events: EventLog[];
}

export type RejectionReasonCategory =
  | 'LINEN_UNMADE'
  | 'SURFACE_UNCLEAN'
  | 'TRASH_REMAINS'
  | 'PRIVACY_ISSUE_DETECTED'
  | 'BLURRY_OR_IMPROPER_ANGLE'
  | 'OTHER_OPERATIONAL';

export interface WorkflowSettings {
  billingOptional: boolean;
  pendingPhotoExpiryDays: number;     // Prototype assumption: 7 days
  approvedPhotoRetentionHours: number; // Prototype assumption: 48 hours
  autoPurgeIntervalSeconds: number;   // In-app check interval
}

export interface StoredPhotoMeta {
  caseId: string;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved';
  sizeBytes: number;
}

