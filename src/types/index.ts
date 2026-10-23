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

// ==========================================
// B. Lab Operations
// ==========================================
export type LabInstrumentStatus = 'ONLINE' | 'IN_USE' | 'CALIBRATING' | 'MAINTENANCE';

export interface LabInstrument {
  id: string;
  name: string;
  department: string;
  labRoom: string;
  status: LabInstrumentStatus;
  utilizationRate: number; // 0-100
  currentBatchQueue: number;
  maintenanceDue?: string;
  lastCalibratedAt: string;
}

export interface LabReservation {
  id: string;
  instrumentId: string;
  instrumentName: string;
  testType: string;
  requestingDepartment: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  priority: 'ROUTINE' | 'STAT_URGENT' | 'HIGH';
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  technicianNote?: string;
}

// ==========================================
// C. Equipment Management
// ==========================================
export type EquipmentCategory =
  | 'LIFE_SUPPORT'
  | 'DIAGNOSTIC'
  | 'SURGICAL'
  | 'PATIENT_MONITORING'
  | 'INFUSION_THERAPY'
  | 'MOBILITY_TRANSFER';

export type EquipmentOperationalStatus = 'OPERATIONAL' | 'IN_USE' | 'MAINTENANCE_DUE' | 'OUT_OF_SERVICE';

export interface EquipmentItem {
  id: string; // e.g. "EQ-VENT-04"
  name: string;
  category: EquipmentCategory;
  model: string;
  serialNumber: string;
  currentWard: string;
  status: EquipmentOperationalStatus;
  utilizationPercent: number;
  lastTelemetryTimestamp: string;
  scheduledMaintenance: string;
  activeBookingId?: string;
  blockerReason?: string;
}

export interface EquipmentBooking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  requestingWard: string;
  reservedBy: string;
  date: string;
  startTime: string;
  hours: number;
  purpose: string;
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'RELEASED' | 'CANCELLED';
}

// ==========================================
// E. Health Camps (Outreach)
// ==========================================
export interface CampAllocation {
  id: string;
  resourceCategory: 'CARE_KITS' | 'SCREENING_KITS' | 'STAFF_SHIFTS' | 'TRANSPORT_UNITS' | 'MEDICINE_SUPPLIES';
  resourceName: string;
  units: number;
  allocatingDepartment: string;
  timestamp: string;
}

export interface CampRecord {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  coordinatorName: string;
  capacityUnits: number;
  allocatedUnits: number;
  warningThresholdPercent: number;
  status: 'PLANNING' | 'ACTIVE' | 'CONCLUDED';
  allocations: CampAllocation[];
}

// ==========================================
// F. Emergency Pharmacy
// ==========================================
export type PharmacyCategory =
  | 'EMERGENCY_INJECTIONS'
  | 'IV_FLUIDS'
  | 'CARDIAC_SUPPORT'
  | 'ANTIBIOTICS'
  | 'RESPIRATORY'
  | 'CONSUMABLES';

export interface PharmacyItem {
  id: string; // e.g. "DRUG-EPI-01"
  name: string;
  category: PharmacyCategory;
  batchNumber: string;
  expiryDate: string;
  currentStock: number;
  minThreshold: number;
  unit: string; // "ampoules", "vials", "IV bags", "blister packs"
  status: 'NORMAL' | 'LOW_STOCK' | 'CRITICAL';
  storageLocation: string; // e.g. "Crash Box A-1"
  lastUpdated: string;
}

export interface StockTransaction {
  id: string;
  drugId: string;
  drugName: string;
  timestamp: string;
  actor: string;
  changeDelta: number; // positive for restock, negative for dispensing
  previousStock: number;
  newStock: number;
  reason: 'RESTOCK_DELIVERY' | 'EMERGENCY_DISPENSE' | 'WARD_REQUISITION' | 'DAMAGED_DISPOSAL' | 'ROUTINE_CYCLE_COUNT';
  notes?: string;
}

// ==========================================
// G. Emergency & Trauma
// ==========================================
export type TraumaBayStatus =
  | 'READY'
  | 'IN_USE'
  | 'CLEANING_REQUIRED'
  | 'MAINTENANCE'
  | 'BLOCKED'
  | 'AWAITING_CONFIRMATION';

export interface TraumaChecklist {
  crashCartChecked: boolean;
  defibrillatorCharged: boolean;
  ventilatorTested: boolean;
  suctionOperational: boolean;
  oxygenPipedOk: boolean;
  monitorsSanitized: boolean;
}

export interface TraumaBay {
  id: string;
  bayNumber: string; // "Bay 01 - Resuscitation"
  bayType: 'RESUSCITATION' | 'MAJOR_TRAUMA' | 'CRITICAL_POLYTRAUMA' | 'PEDIATRIC_TRAUMA' | 'MINOR_PROCEDURE' | 'ISOLATION_TRAUMA';
  status: TraumaBayStatus;
  lastUpdated: string;
  blockerReason?: string;
  assignedTeam?: string;
  checklist: TraumaChecklist;
  lastInspector: string;
}

// ==========================================
// H. Doctor Schedule
// ==========================================
export type DoctorDutyStatus = 'ON_DUTY' | 'ON_CALL' | 'IN_SURGERY' | 'SCHEDULED' | 'OFF_DUTY';

export interface DoctorScheduleEntry {
  id: string;
  doctorName: string;
  specialty: string;
  department: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  shiftHours: string; // "07:00 - 15:00"
  date: string; // YYYY-MM-DD
  status: DoctorDutyStatus;
  intercomExt: string;
  locationRoom: string;
  isCoveringWard: boolean;
}

export interface DoctorCoverageAlert {
  department: string;
  shift: string;
  requiredDoctors: number;
  scheduledDoctors: number;
  deficit: number;
  severity: 'WARNING' | 'CRITICAL';
}

// ==========================================
// I. Staff Availability (Nursing & Paramedical)
// ==========================================
export type StaffRole =
  | 'CHARGE_NURSE'
  | 'STAFF_NURSE'
  | 'ICU_SPECIALIST_NURSE'
  | 'NURSING_ORDERLY'
  | 'HOUSEKEEPING_SUPERVISOR'
  | 'PHLEBOTOMIST'
  | 'RADIOLOGY_TECH';

export type StaffStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_TRANSIT' | 'ON_BREAK' | 'OFF_DUTY';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  status: StaffStatus;
  contactExt: string;
  assignedArea: string;
}

export interface DepartmentStaffCoverage {
  department: string;
  planned: number;
  available: number;
  coveragePercent: number;
  shortfall: number;
}

// ==========================================
// J. Operational Alerts
// ==========================================
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertCategory =
  | 'BED_TURNAROUND'
  | 'EQUIPMENT_DOWNTIME'
  | 'PHARMACY_STOCKOUT'
  | 'STAFFING_GAP'
  | 'LAB_CONFLICT'
  | 'TRAUMA_BLOCK'
  | 'FACILITY_SAFETY';

export interface OperationalAlert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  department: string;
  resourceRef?: string;
  summary: string;
  details?: string;
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

// ==========================================
// Navigation & Route Definitions
// ==========================================
export type AppRoute =
  | 'dashboard'
  | 'labs'
  | 'equipment'
  | 'beds'
  | 'camps'
  | 'pharmacy'
  | 'trauma'
  | 'clinicians'
  | 'staff'
  | 'alerts'
  | 'reports'
  | 'settings';

