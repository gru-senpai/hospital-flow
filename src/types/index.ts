export type CaseStatus =
  | 'HANDOFFS_PENDING'        // Nursing / Billing handoffs incomplete or awaiting room departure
  | 'CLEANING_IN_PROGRESS'    // Departure confirmed, Housekeeping is cleaning
  | 'AWAITING_REVIEW'         // Cleaning complete, AI Camera Vision scan queued
  | 'BED_READY'               // Confirmed Bed Ready autonomously by AI Camera Vision
  | 'REJECTED_RECLEAN';       // AI Vision flagged anomaly, automated re-clean retriggered

export type TurnaroundPriority = 'NORMAL' | 'URGENT' | 'HIGH_TURNOVER';

export interface AiCameraInspection {
  cameraId: string;
  lensLocation: string;
  model: string;
  timestamp: string;
  confidenceScore: number;
  verdict: 'VERIFIED_READY' | 'ANOMALY_DETECTED';
  checkpoints: {
    surfaceSanitized: boolean;
    linenFittedAndSterile: boolean;
    bioWasteCleared: boolean;
    medicalGasTerminalsCapped: boolean;
    zeroPiiPrivacyPass: boolean;
  };
  detectedAnomalies?: string[];
  aiDecisionSummary: string;
}

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
    | 'AI_INSPECTION'
    | 'APPROVAL_NOTICE'
    | 'REJECTION_NOTICE'
    | 'PHOTO_PURGED'
    | 'PHOTO_EXPIRED';
  actorLabel: string; // e.g. "Operations", "Nursing", "Billing / TPA", "Housekeeping", "AI Vision Camera (CAM-W4B-01)"
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

  // Step 4: Autonomous AI Camera Vision Inspection
  aiInspection?: AiCameraInspection;
  photoUploaded: boolean;
  photoUploadedAt?: string;
  photoExpiresAt?: string;
  photoPurged: boolean;
  photoPurgedAt?: string;

  // Step 5: Automated Confirmation (Zero Human Approval Required)
  approvedAt?: string;
  approverLabel?: string; // e.g. "HospitalFlow Vision AI (Autonomous)"
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
  | 'nursing'
  | 'housekeeping'
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

// ==========================================
// Role & Persona Segregation
// ==========================================
export type HospitalPersonaId =
  | 'ALL_ADMIN'
  | 'CHARGE_NURSE'
  | 'HOUSEKEEPING_LEAD'
  | 'EMERGENCY_PHYSICIAN'
  | 'CLINICAL_PHARMACIST'
  | 'BIOMEDICAL_ENGINEER';

export interface HospitalPersona {
  id: HospitalPersonaId;
  name: string;
  title: string;
  roleShort: string;
  department: string;
  initials: string;
  avatarColor: string;
  badgeTone: 'indigo' | 'blue' | 'teal' | 'red' | 'amber' | 'purple';
  defaultRoute: AppRoute;
  primaryRoutes: AppRoute[];
  shift: string;
  assignedArea: string;
  coreResponsibilities: string[];
  quickActions: Array<{
    label: string;
    route: AppRoute;
    actionType?: 'createCase' | 'openSearch' | 'syncData';
  }>;
}

export const PERSONA_PRESETS: HospitalPersona[] = [
  {
    id: 'ALL_ADMIN',
    name: 'Dr. Priya Sharma',
    title: 'Operations Director',
    roleShort: 'Administrator / Director',
    department: 'Executive Operations',
    initials: 'PS',
    avatarColor: '#0c1427',
    badgeTone: 'indigo',
    defaultRoute: 'dashboard',
    primaryRoutes: ['dashboard', 'beds', 'alerts', 'reports', 'settings', 'staff', 'clinicians'],
    shift: 'Executive Shift • 24/7 Command',
    assignedArea: 'Central Operations Command Center',
    coreResponsibilities: [
      'Facility-wide patient flow & bed turnover bottlenecks',
      'Inter-departmental operational alert resolution',
      'Zero PII protocol governance & audit oversight',
    ],
    quickActions: [
      { label: 'Overview Dashboard', route: 'dashboard' },
      { label: 'Clinic Bed Turnover', route: 'beds' },
      { label: 'Active Bottlenecks', route: 'alerts' },
      { label: 'Executive Analytics', route: 'reports' },
    ],
  },
  {
    id: 'CHARGE_NURSE',
    name: 'Sister Sunita Rao',
    title: 'Charge Nurse & Clinical Lead',
    roleShort: 'Charge Nurse',
    department: 'Inpatient Clinical Nursing',
    initials: 'SR',
    avatarColor: '#1d4ed8',
    badgeTone: 'blue',
    defaultRoute: 'nursing',
    primaryRoutes: ['nursing', 'beds', 'staff', 'alerts'],
    shift: 'Morning Shift (07:00 - 15:00)',
    assignedArea: 'Ward 4B (Stepdown) & ICU Stepdown',
    coreResponsibilities: [
      'Chart & medication reconciliation handoffs',
      'Clinical transfer & physical room vacate confirmation',
      'On-duty nursing shift allocations & relief coordination',
    ],
    quickActions: [
      { label: 'Nurse Station Handoffs', route: 'nursing' },
      { label: 'Bed Coordination', route: 'beds' },
      { label: 'Nursing Staff Roster', route: 'staff' },
    ],
  },
  {
    id: 'HOUSEKEEPING_LEAD',
    name: 'Supervisor Farooq',
    title: 'Housekeeping & Terminal Sanitation Lead',
    roleShort: 'Housekeeping Lead',
    department: 'Environmental & Facility Operations',
    initials: 'SF',
    avatarColor: '#0f766e',
    badgeTone: 'teal',
    defaultRoute: 'housekeeping',
    primaryRoutes: ['housekeeping', 'beds', 'alerts'],
    shift: 'Morning Sanitation Shift (06:00 - 14:00)',
    assignedArea: 'Terminal Ward 4 & 5 Turnaround Bays',
    coreResponsibilities: [
      '7-step terminal sanitation protocol completion',
      'Overhead AI Camera Vision scan verification sweeps',
      'Immediate reclean turnaround for flagged anomalies',
    ],
    quickActions: [
      { label: 'Sanitation Turnover Board', route: 'housekeeping' },
      { label: 'Bed Readiness Queue', route: 'beds' },
      { label: 'Environmental Alerts', route: 'alerts' },
    ],
  },
  {
    id: 'EMERGENCY_PHYSICIAN',
    name: 'Dr. Arvind Patel',
    title: 'Attending Emergency Physician',
    roleShort: 'Emergency Physician',
    department: 'Acute Care & Resuscitation',
    initials: 'AP',
    avatarColor: '#dc2626',
    badgeTone: 'red',
    defaultRoute: 'trauma',
    primaryRoutes: ['trauma', 'clinicians', 'beds', 'labs'],
    shift: 'Acute Resuscitation Shift (08:00 - 16:00)',
    assignedArea: 'Red Trauma Bay & Resuscitation Suites',
    coreResponsibilities: [
      'Resuscitation bay equipment & ventilator verification',
      'On-duty medical doctor scheduling & specialty coverage',
      'Emergency admissions & STAT diagnostic lab prioritization',
    ],
    quickActions: [
      { label: 'Trauma Bay HUD', route: 'trauma' },
      { label: 'Doctor Roster', route: 'clinicians' },
      { label: 'Bed Availability', route: 'beds' },
    ],
  },
  {
    id: 'CLINICAL_PHARMACIST',
    name: 'Pharm. Ananya Sen',
    title: 'Lead Clinical Pharmacist',
    roleShort: 'Formulary Pharmacist',
    department: 'Pharmacy & Medical Supply Chain',
    initials: 'AS',
    avatarColor: '#d97706',
    badgeTone: 'amber',
    defaultRoute: 'pharmacy',
    primaryRoutes: ['pharmacy', 'alerts', 'reports'],
    shift: 'Dispensing & Formulary Shift (07:30 - 15:30)',
    assignedArea: 'Central Emergency Pharmacy & Crash Boxes',
    coreResponsibilities: [
      'Critical formulary stock levels & stockout prevention',
      'Emergency crash cart batch restock & verification',
      'Ward medication requisitions & audit transactions',
    ],
    quickActions: [
      { label: 'Emergency Formulary', route: 'pharmacy' },
      { label: 'Stockout Alerts', route: 'alerts' },
      { label: 'Supply Chain Reports', route: 'reports' },
    ],
  },
  {
    id: 'BIOMEDICAL_ENGINEER',
    name: 'Eng. Vikram Mehta',
    title: 'Chief Biomedical Engineer',
    roleShort: 'Biomedical Engineer',
    department: 'Biomedical Engineering & Diagnostics',
    initials: 'VM',
    avatarColor: '#7c3aed',
    badgeTone: 'purple',
    defaultRoute: 'equipment',
    primaryRoutes: ['equipment', 'labs', 'alerts'],
    shift: 'Technical & Telemetry Coverage',
    assignedArea: 'Biomedical Lab & Diagnostic Suites',
    coreResponsibilities: [
      'Life-support ventilator & imaging telemetry tracking',
      'Scheduled preventive maintenance & recalibration cycles',
      'Diagnostic auto-analyzer uptime & reservation queues',
    ],
    quickActions: [
      { label: 'Biomedical Assets', route: 'equipment' },
      { label: 'Lab Instrument HUD', route: 'labs' },
      { label: 'Maintenance Alerts', route: 'alerts' },
    ],
  },
];

