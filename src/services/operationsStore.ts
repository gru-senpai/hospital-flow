import { useState, useEffect, useCallback } from 'react';
import type {
  LabInstrument,
  LabReservation,
  EquipmentItem,
  EquipmentBooking,
  CampRecord,
  CampAllocation,
  PharmacyItem,
  StockTransaction,
  TraumaBay,
  DoctorScheduleEntry,
  StaffMember,
  OperationalAlert,
} from '../types';

// ============================================================================
// LocalStorage Keys
// ============================================================================
const KEYS = {
  LABS: 'hospitalflow_labs_v2',
  LAB_RESERVATIONS: 'hospitalflow_lab_res_v2',
  EQUIPMENT: 'hospitalflow_equipment_v2',
  EQUIPMENT_BOOKINGS: 'hospitalflow_eq_bookings_v2',
  CAMPS: 'hospitalflow_camps_v2',
  PHARMACY: 'hospitalflow_pharmacy_v2',
  PHARMACY_TX: 'hospitalflow_pharmacy_tx_v2',
  TRAUMA: 'hospitalflow_trauma_v2',
  DOCTORS: 'hospitalflow_doctors_v2',
  STAFF: 'hospitalflow_staff_v2',
  ALERTS: 'hospitalflow_alerts_v2',
};

// ============================================================================
// Initial Demo Datasets (Strictly Synthetic Demo Data)
// ============================================================================

export const INITIAL_LAB_INSTRUMENTS: LabInstrument[] = [
  {
    id: 'LAB-BIO-01',
    name: 'Cobas c311 Chemistry Auto-Analyzer',
    department: 'Biochemistry',
    labRoom: 'Diagnostic Wing Rm 102',
    status: 'ONLINE',
    utilizationRate: 84,
    currentBatchQueue: 18,
    lastCalibratedAt: 'Today, 06:00',
  },
  {
    id: 'LAB-HEM-02',
    name: 'Sysmex XN-1000 Hematology Analyzer',
    department: 'Hematology',
    labRoom: 'Diagnostic Wing Rm 104',
    status: 'IN_USE',
    utilizationRate: 92,
    currentBatchQueue: 24,
    lastCalibratedAt: 'Today, 05:30',
  },
  {
    id: 'LAB-PCR-03',
    name: 'GeneXpert IV Automated RT-PCR',
    department: 'Molecular Biology',
    labRoom: 'Isolation Lab B',
    status: 'ONLINE',
    utilizationRate: 65,
    currentBatchQueue: 6,
    lastCalibratedAt: 'Yesterday, 18:00',
  },
  {
    id: 'LAB-RAD-04',
    name: 'DRX-Evolution Plus Digital Radiography',
    department: 'Radiology',
    labRoom: 'Imaging Suite 1',
    status: 'ONLINE',
    utilizationRate: 78,
    currentBatchQueue: 8,
    lastCalibratedAt: '2 days ago',
  },
  {
    id: 'LAB-ABG-05',
    name: 'Radiometer ABL90 FLEX Blood Gas Analyzer',
    department: 'Critical Care Lab',
    labRoom: 'ICU Satellite Lab',
    status: 'CALIBRATING',
    utilizationRate: 50,
    currentBatchQueue: 0,
    maintenanceDue: 'In 3 hours',
    lastCalibratedAt: 'In Progress (Cycle #3)',
  },
];

export const INITIAL_LAB_RESERVATIONS: LabReservation[] = [
  {
    id: 'RES-LAB-101',
    instrumentId: 'LAB-BIO-01',
    instrumentName: 'Cobas c311 Chemistry Auto-Analyzer',
    testType: 'Cardiac Enzymes & Troponin I Panel',
    requestingDepartment: 'Emergency & Trauma',
    date: new Date().toISOString().slice(0, 10),
    startTime: '08:30',
    endTime: '09:30',
    durationMinutes: 60,
    priority: 'STAT_URGENT',
    status: 'RUNNING',
    technicianNote: 'Stat acute coronary syndrome workup',
  },
  {
    id: 'RES-LAB-102',
    instrumentId: 'LAB-HEM-02',
    instrumentName: 'Sysmex XN-1000 Hematology Analyzer',
    testType: 'Coagulation Profile & CBC with Diff',
    requestingDepartment: 'Ward 4B (Stepdown)',
    date: new Date().toISOString().slice(0, 10),
    startTime: '10:00',
    endTime: '11:00',
    durationMinutes: 60,
    priority: 'HIGH',
    status: 'SCHEDULED',
  },
  {
    id: 'RES-LAB-103',
    instrumentId: 'LAB-RAD-04',
    instrumentName: 'DRX-Evolution Plus Digital Radiography',
    testType: 'Portable Chest X-Ray Verification',
    requestingDepartment: 'ICU Ward 5A',
    date: new Date().toISOString().slice(0, 10),
    startTime: '11:30',
    endTime: '12:15',
    durationMinutes: 45,
    priority: 'ROUTINE',
    status: 'SCHEDULED',
  },
];

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'EQ-VENT-01',
    name: 'Hamilton-C6 Intensive Care Ventilator',
    category: 'LIFE_SUPPORT',
    model: 'Hamilton-C6 v2.4',
    serialNumber: 'HC6-99201',
    currentWard: 'ICU Ward 5A',
    status: 'IN_USE',
    utilizationPercent: 95,
    lastTelemetryTimestamp: 'Just now (100% O2 sensor OK)',
    scheduledMaintenance: '2026-11-15',
  },
  {
    id: 'EQ-VENT-02',
    name: 'Puritan Bennett 980 ICU Ventilator',
    category: 'LIFE_SUPPORT',
    model: 'PB-980',
    serialNumber: 'PB-44810',
    currentWard: 'Trauma Bay 01',
    status: 'OPERATIONAL',
    utilizationPercent: 40,
    lastTelemetryTimestamp: '4 mins ago (Self-test passed)',
    scheduledMaintenance: '2026-11-20',
  },
  {
    id: 'EQ-DEFIB-01',
    name: 'ZOLL R Series Plus Biphasic Defibrillator',
    category: 'LIFE_SUPPORT',
    model: 'ZOLL-R-12',
    serialNumber: 'ZR-88192',
    currentWard: 'Crash Cart Ward 4B',
    status: 'OPERATIONAL',
    utilizationPercent: 15,
    lastTelemetryTimestamp: '8 mins ago (Battery 100%)',
    scheduledMaintenance: '2026-12-01',
  },
  {
    id: 'EQ-DIAL-01',
    name: 'Fresenius 5008S CorDiax Hemodialysis',
    category: 'LIFE_SUPPORT',
    model: '5008S-CorDiax',
    serialNumber: 'FR-33019',
    currentWard: 'Day Care Dialysis Bay 2',
    status: 'IN_USE',
    utilizationPercent: 88,
    lastTelemetryTimestamp: '12 mins ago (Dialysate flux normal)',
    scheduledMaintenance: '2026-11-05',
  },
  {
    id: 'EQ-INF-01',
    name: 'Alaris Infusion Pump Quad System',
    category: 'INFUSION_THERAPY',
    model: 'BD Alaris 8015',
    serialNumber: 'BD-55102',
    currentWard: 'Ward 4B (Stepdown)',
    status: 'OPERATIONAL',
    utilizationPercent: 70,
    lastTelemetryTimestamp: '15 mins ago',
    scheduledMaintenance: '2026-12-10',
  },
  {
    id: 'EQ-MON-01',
    name: 'Philips IntelliVue MX800 Bedside Monitor',
    category: 'PATIENT_MONITORING',
    model: 'MX800 High-Acuity',
    serialNumber: 'PH-11029',
    currentWard: 'Room 402, Bed 1',
    status: 'OPERATIONAL',
    utilizationPercent: 80,
    lastTelemetryTimestamp: '2 mins ago (ECG/SPO2 link active)',
    scheduledMaintenance: '2026-11-25',
  },
  {
    id: 'EQ-USG-01',
    name: 'SonoSite Edge II Point-of-Care Ultrasound',
    category: 'DIAGNOSTIC',
    model: 'Edge II POCUS',
    serialNumber: 'SS-77180',
    currentWard: 'Emergency & Trauma',
    status: 'OPERATIONAL',
    utilizationPercent: 62,
    lastTelemetryTimestamp: '22 mins ago (Clean probe docked)',
    scheduledMaintenance: '2026-11-30',
  },
  {
    id: 'EQ-CARM-01',
    name: 'GE OEC One CFD Surgical C-Arm',
    category: 'SURGICAL',
    model: 'OEC One CFD',
    serialNumber: 'GE-99104',
    currentWard: 'Operation Theatre 2',
    status: 'MAINTENANCE_DUE',
    utilizationPercent: 45,
    lastTelemetryTimestamp: '1 hour ago (Radiation sensor flag)',
    scheduledMaintenance: 'Today (Pending physics inspection)',
    blockerReason: 'Annual collimator recalibration required before clinical use',
  },
  {
    id: 'EQ-ECG-01',
    name: 'GE MAC 2000 12-Lead Diagnostic ECG',
    category: 'DIAGNOSTIC',
    model: 'MAC 2000',
    serialNumber: 'GE-22910',
    currentWard: 'OPD / Triage Desk',
    status: 'OPERATIONAL',
    utilizationPercent: 75,
    lastTelemetryTimestamp: '5 mins ago',
    scheduledMaintenance: '2026-12-15',
  },
];

export const INITIAL_EQUIPMENT_BOOKINGS: EquipmentBooking[] = [
  {
    id: 'BK-EQ-201',
    equipmentId: 'EQ-VENT-01',
    equipmentName: 'Hamilton-C6 Intensive Care Ventilator',
    requestingWard: 'ICU Ward 5A',
    reservedBy: 'Charge Nurse Mathew',
    date: new Date().toISOString().slice(0, 10),
    startTime: '07:00',
    hours: 24,
    purpose: 'Post-op respiratory support protocol',
    status: 'IN_PROGRESS',
  },
  {
    id: 'BK-EQ-202',
    equipmentId: 'EQ-USG-01',
    equipmentName: 'SonoSite Edge II Point-of-Care Ultrasound',
    requestingWard: 'Emergency & Trauma',
    reservedBy: 'Dr. Rahul Varma',
    date: new Date().toISOString().slice(0, 10),
    startTime: '13:00',
    hours: 3,
    purpose: 'FAST scan trauma series training and triage',
    status: 'CONFIRMED',
  },
];

export const INITIAL_CAMPS: CampRecord[] = [
  {
    id: 'CAMP-NORTH-01',
    name: 'Northside Community Preventive Health Camp',
    location: 'Northside Municipal Community Hall, Sector 14',
    startDate: '2026-10-25',
    endDate: '2026-10-27',
    coordinatorName: 'Dr. Meera Nambiar (Public Health Outreach)',
    capacityUnits: 150,
    allocatedUnits: 104,
    warningThresholdPercent: 80,
    status: 'ACTIVE',
    allocations: [
      {
        id: 'ALC-01',
        resourceCategory: 'CARE_KITS',
        resourceName: 'Antenatal & Diabetic Screening Kits',
        units: 45,
        allocatingDepartment: 'Community Medicine',
        timestamp: 'Today, 07:15',
      },
      {
        id: 'ALC-02',
        resourceCategory: 'STAFF_SHIFTS',
        resourceName: 'Nursing & Phlebotomy Field Shifts',
        units: 24,
        allocatingDepartment: 'Nursing Administration',
        timestamp: 'Today, 08:00',
      },
      {
        id: 'ALC-03',
        resourceCategory: 'SCREENING_KITS',
        resourceName: 'Hypertension & Lipid Rapid Strips',
        units: 25,
        allocatingDepartment: 'Diagnostic Outreach',
        timestamp: 'Today, 08:30',
      },
      {
        id: 'ALC-04',
        resourceCategory: 'TRANSPORT_UNITS',
        resourceName: 'Mobile Sample Cold-Chain Transits',
        units: 10,
        allocatingDepartment: 'Logistics',
        timestamp: 'Today, 09:10',
      },
    ],
  },
];

export const INITIAL_PHARMACY_ITEMS: PharmacyItem[] = [
  {
    id: 'DRUG-EPI-01',
    name: 'Epinephrine Injection 1mg/1mL (1:1000)',
    category: 'EMERGENCY_INJECTIONS',
    batchNumber: 'EP-9921B',
    expiryDate: '2027-08-31',
    currentStock: 18,
    minThreshold: 25,
    unit: 'ampoules',
    status: 'LOW_STOCK',
    storageLocation: 'Crash Cart Box A1',
    lastUpdated: '10 mins ago',
  },
  {
    id: 'DRUG-ATR-02',
    name: 'Atropine Sulfate 0.6mg/mL',
    category: 'CARDIAC_SUPPORT',
    batchNumber: 'AT-4482',
    expiryDate: '2027-04-30',
    currentStock: 12,
    minThreshold: 20,
    unit: 'vials',
    status: 'LOW_STOCK',
    storageLocation: 'Emergency Shelf 2',
    lastUpdated: '25 mins ago',
  },
  {
    id: 'DRUG-NS-03',
    name: '0.9% Normal Saline IV Infusion 500mL',
    category: 'IV_FLUIDS',
    batchNumber: 'NS-8812K',
    expiryDate: '2028-01-31',
    currentStock: 140,
    minThreshold: 50,
    unit: 'IV bags',
    status: 'NORMAL',
    storageLocation: 'Fluid Bay Main Store',
    lastUpdated: '1 hour ago',
  },
  {
    id: 'DRUG-RL-04',
    name: "Ringer's Lactate Solution 500mL",
    category: 'IV_FLUIDS',
    batchNumber: 'RL-1029',
    expiryDate: '2027-11-30',
    currentStock: 95,
    minThreshold: 40,
    unit: 'IV bags',
    status: 'NORMAL',
    storageLocation: 'Fluid Bay Main Store',
    lastUpdated: '2 hours ago',
  },
  {
    id: 'DRUG-AMI-05',
    name: 'Amiodarone HCl Injection 150mg/3mL',
    category: 'CARDIAC_SUPPORT',
    batchNumber: 'AM-7721',
    expiryDate: '2027-06-30',
    currentStock: 8,
    minThreshold: 15,
    unit: 'ampoules',
    status: 'CRITICAL',
    storageLocation: 'Crash Cart Box A2',
    lastUpdated: '15 mins ago',
  },
  {
    id: 'DRUG-NOR-06',
    name: 'Norepinephrine Bitartrate 4mg/2mL',
    category: 'CARDIAC_SUPPORT',
    batchNumber: 'NE-6610',
    expiryDate: '2027-09-30',
    currentStock: 22,
    minThreshold: 20,
    unit: 'ampoules',
    status: 'NORMAL',
    storageLocation: 'Emergency Resus Safe',
    lastUpdated: '40 mins ago',
  },
  {
    id: 'DRUG-TXA-07',
    name: 'Tranexamic Acid Injection 500mg/5mL',
    category: 'EMERGENCY_INJECTIONS',
    batchNumber: 'TX-3301',
    expiryDate: '2028-03-31',
    currentStock: 34,
    minThreshold: 20,
    unit: 'vials',
    status: 'NORMAL',
    storageLocation: 'Trauma Pharmacy Rack 1',
    lastUpdated: '1 hour ago',
  },
  {
    id: 'DRUG-FUR-08',
    name: 'Furosemide Injection 20mg/2mL',
    category: 'EMERGENCY_INJECTIONS',
    batchNumber: 'FR-9012',
    expiryDate: '2027-12-31',
    currentStock: 48,
    minThreshold: 30,
    unit: 'ampoules',
    status: 'NORMAL',
    storageLocation: 'Shelf 3B',
    lastUpdated: '3 hours ago',
  },
  {
    id: 'DRUG-SAL-09',
    name: 'Salbutamol Nebulising Respules 2.5mg',
    category: 'RESPIRATORY',
    batchNumber: 'SB-5509',
    expiryDate: '2027-05-31',
    currentStock: 60,
    minThreshold: 40,
    unit: 'respules',
    status: 'NORMAL',
    storageLocation: 'Respiratory Cart B',
    lastUpdated: '5 hours ago',
  },
];

export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'TX-01',
    drugId: 'DRUG-EPI-01',
    drugName: 'Epinephrine Injection 1mg/1mL',
    timestamp: 'Today, 08:15',
    actor: 'Pharmacist Arvind',
    changeDelta: -2,
    previousStock: 20,
    newStock: 18,
    reason: 'EMERGENCY_DISPENSE',
    notes: 'Dispatched for Trauma Bay 1 acute resuscitation kit',
  },
  {
    id: 'TX-02',
    drugId: 'DRUG-NS-03',
    drugName: '0.9% Normal Saline IV Infusion 500mL',
    timestamp: 'Today, 07:00',
    actor: 'Inventory Store Supervisor',
    changeDelta: 50,
    previousStock: 90,
    newStock: 140,
    reason: 'RESTOCK_DELIVERY',
    notes: 'Consignment PO #8891 received from central depot',
  },
];

export const INITIAL_TRAUMA_BAYS: TraumaBay[] = [
  {
    id: 'BAY-01',
    bayNumber: 'Trauma Bay 01',
    bayType: 'RESUSCITATION',
    status: 'READY',
    lastUpdated: '5 mins ago',
    checklist: {
      crashCartChecked: true,
      defibrillatorCharged: true,
      ventilatorTested: true,
      suctionOperational: true,
      oxygenPipedOk: true,
      monitorsSanitized: true,
    },
    lastInspector: 'Staff Nurse Sunita (Charge)',
  },
  {
    id: 'BAY-02',
    bayNumber: 'Trauma Bay 02',
    bayType: 'MAJOR_TRAUMA',
    status: 'IN_USE',
    lastUpdated: '22 mins ago',
    assignedTeam: 'Code Red Trauma Team Alpha',
    checklist: {
      crashCartChecked: true,
      defibrillatorCharged: true,
      ventilatorTested: true,
      suctionOperational: true,
      oxygenPipedOk: true,
      monitorsSanitized: true,
    },
    lastInspector: 'Dr. Rahul Varma',
  },
  {
    id: 'BAY-03',
    bayNumber: 'Trauma Bay 03',
    bayType: 'CRITICAL_POLYTRAUMA',
    status: 'READY',
    lastUpdated: '12 mins ago',
    checklist: {
      crashCartChecked: true,
      defibrillatorCharged: true,
      ventilatorTested: true,
      suctionOperational: true,
      oxygenPipedOk: true,
      monitorsSanitized: true,
    },
    lastInspector: 'Nursing Orderly Ravi',
  },
  {
    id: 'BAY-04',
    bayNumber: 'Trauma Bay 04',
    bayType: 'PEDIATRIC_TRAUMA',
    status: 'AWAITING_CONFIRMATION',
    lastUpdated: '18 mins ago',
    checklist: {
      crashCartChecked: true,
      defibrillatorCharged: true,
      ventilatorTested: false, // Flagged
      suctionOperational: true,
      oxygenPipedOk: true,
      monitorsSanitized: true,
    },
    lastInspector: 'Nurse Anitha',
    blockerReason: 'Pediatric ventilator circuit leak test pending coordinator signoff',
  },
  {
    id: 'BAY-05',
    bayNumber: 'Trauma Bay 05',
    bayType: 'MINOR_PROCEDURE',
    status: 'CLEANING_REQUIRED',
    lastUpdated: '8 mins ago',
    checklist: {
      crashCartChecked: false,
      defibrillatorCharged: false,
      ventilatorTested: false,
      suctionOperational: false,
      oxygenPipedOk: false,
      monitorsSanitized: false,
    },
    lastInspector: 'Housekeeping Crew 02',
    blockerReason: 'Suture procedure concluded; terminal sanitization in progress',
  },
  {
    id: 'BAY-06',
    bayNumber: 'Trauma Bay 06',
    bayType: 'ISOLATION_TRAUMA',
    status: 'READY',
    lastUpdated: '35 mins ago',
    checklist: {
      crashCartChecked: true,
      defibrillatorCharged: true,
      ventilatorTested: true,
      suctionOperational: true,
      oxygenPipedOk: true,
      monitorsSanitized: true,
    },
    lastInspector: 'Infection Control Specialist',
  },
];

export const INITIAL_DOCTORS: DoctorScheduleEntry[] = [
  {
    id: 'DOC-01',
    doctorName: 'Dr. Priya Sharma, MD',
    specialty: 'Emergency Medicine',
    department: 'Emergency & Trauma',
    shift: 'MORNING',
    shiftHours: '07:00 - 15:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'ON_DUTY',
    intercomExt: 'Ext 401',
    locationRoom: 'Resus Command 1',
    isCoveringWard: true,
  },
  {
    id: 'DOC-02',
    doctorName: 'Dr. Rahul Varma, MS, MCh',
    specialty: 'Trauma & Acute Surgery',
    department: 'Emergency & Trauma',
    shift: 'MORNING',
    shiftHours: '07:00 - 15:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'IN_SURGERY',
    intercomExt: 'Ext 402',
    locationRoom: 'OT Suite 2',
    isCoveringWard: false,
  },
  {
    id: 'DOC-03',
    doctorName: 'Dr. Ananya Roy, MD, DM',
    specialty: 'Interventional Cardiology',
    department: 'Cardiology',
    shift: 'MORNING',
    shiftHours: '07:00 - 15:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'ON_DUTY',
    intercomExt: 'Ext 310',
    locationRoom: 'Cath Lab 1',
    isCoveringWard: true,
  },
  {
    id: 'DOC-04',
    doctorName: 'Dr. Suresh Nair, MD',
    specialty: 'Critical Care Medicine',
    department: 'Intensive Care (ICU)',
    shift: 'MORNING',
    shiftHours: '07:00 - 15:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'ON_DUTY',
    intercomExt: 'Ext 501',
    locationRoom: 'ICU Ward 5A',
    isCoveringWard: true,
  },
  {
    id: 'DOC-05',
    doctorName: 'Dr. Vikram Malhotra, MS',
    specialty: 'Orthopedic Trauma',
    department: 'Orthopedics',
    shift: 'EVENING',
    shiftHours: '15:00 - 23:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'ON_CALL',
    intercomExt: 'Ext 205',
    locationRoom: 'On-Call Quarters B',
    isCoveringWard: false,
  },
  {
    id: 'DOC-06',
    doctorName: 'Dr. Kavita Joshi, MD',
    specialty: 'Anesthesiology & Pain',
    department: 'Anesthesia',
    shift: 'MORNING',
    shiftHours: '07:00 - 15:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'ON_DUTY',
    intercomExt: 'Ext 112',
    locationRoom: 'OT Complex',
    isCoveringWard: true,
  },
  {
    id: 'DOC-07',
    doctorName: 'Dr. Mohan Reddy, MD',
    specialty: 'General Internal Medicine',
    department: 'Ward 4B (Stepdown)',
    shift: 'MORNING',
    shiftHours: '07:00 - 15:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'ON_DUTY',
    intercomExt: 'Ext 440',
    locationRoom: 'Ward 4B Nurses Station',
    isCoveringWard: true,
  },
  {
    id: 'DOC-08',
    doctorName: 'Dr. Zainab Khan, MD',
    specialty: 'Emergency Medicine',
    department: 'Emergency & Trauma',
    shift: 'NIGHT',
    shiftHours: '23:00 - 07:00',
    date: new Date().toISOString().slice(0, 10),
    status: 'SCHEDULED',
    intercomExt: 'Ext 403',
    locationRoom: 'Triage Room 3',
    isCoveringWard: false,
  },
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'STF-01', name: 'Sister Sunita Rao', role: 'CHARGE_NURSE', department: 'Emergency & Trauma', shift: 'MORNING', status: 'AVAILABLE', contactExt: 'Ext 411', assignedArea: 'Triage & Bay 1-3' },
  { id: 'STF-02', name: 'Staff Nurse Deepa', role: 'STAFF_NURSE', department: 'Emergency & Trauma', shift: 'MORNING', status: 'ASSIGNED', contactExt: 'Ext 412', assignedArea: 'Trauma Bay 02' },
  { id: 'STF-03', name: 'Mathew Abraham', role: 'ICU_SPECIALIST_NURSE', department: 'Intensive Care (ICU)', shift: 'MORNING', status: 'ASSIGNED', contactExt: 'Ext 510', assignedArea: 'Bed 501-502' },
  { id: 'STF-04', name: 'Staff Nurse Lakshmi', role: 'STAFF_NURSE', department: 'Ward 4B (Stepdown)', shift: 'MORNING', status: 'AVAILABLE', contactExt: 'Ext 421', assignedArea: 'Rooms 401-404' },
  { id: 'STF-05', name: 'Orderly Rajesh', role: 'NURSING_ORDERLY', department: 'Ward 4B (Stepdown)', shift: 'MORNING', status: 'ASSIGNED', contactExt: 'Ext 422', assignedArea: 'Patient Transfers' },
  { id: 'STF-06', name: 'Supervisor Farooq', role: 'HOUSEKEEPING_SUPERVISOR', department: 'Facility Operations', shift: 'MORNING', status: 'AVAILABLE', contactExt: 'Ext 901', assignedArea: 'Ward 4 & 5 Turnarounds' },
  { id: 'STF-07', name: 'Rohan Deshmukh', role: 'PHLEBOTOMIST', department: 'Biochemistry Lab', shift: 'MORNING', status: 'AVAILABLE', contactExt: 'Ext 105', assignedArea: 'Ward Rounds Sampling' },
  { id: 'STF-08', name: 'Sanjay Kumar', role: 'RADIOLOGY_TECH', department: 'Radiology', shift: 'MORNING', status: 'ASSIGNED', contactExt: 'Ext 108', assignedArea: 'Portable X-Ray Unit 1' },
];

export const INITIAL_ALERTS: OperationalAlert[] = [
  {
    id: 'ALT-101',
    title: 'Critical Low Stock: Amiodarone HCl 150mg',
    category: 'PHARMACY_STOCKOUT',
    severity: 'CRITICAL',
    status: 'NEW',
    department: 'Emergency Pharmacy',
    resourceRef: 'DRUG-AMI-05',
    summary: 'Crash cart stock below minimum buffer (8 remaining, 15 required)',
    details: 'Urgent requisition needed from central hospital warehouse before evening trauma intake peak.',
    timestamp: '15 mins ago',
  },
  {
    id: 'ALT-102',
    title: 'Equipment Maintenance Due: GE Surgical C-Arm',
    category: 'EQUIPMENT_DOWNTIME',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    department: 'Operation Theatre 2',
    resourceRef: 'EQ-CARM-01',
    summary: 'Annual collimator recalibration required before scheduled surgeries',
    details: 'Bio-medical engineering notified. OT 2 blocked for non-emergency fluoroscopy procedures.',
    timestamp: '1 hour ago',
    acknowledgedBy: 'Coordinator (Simulated)',
    acknowledgedAt: '45 mins ago',
  },
  {
    id: 'ALT-103',
    title: 'Bed Turnover Delayed: Room 402 Bed 1',
    category: 'BED_TURNAROUND',
    severity: 'WARNING',
    status: 'NEW',
    department: 'Ward 4B (Stepdown)',
    resourceRef: 'HF-2490',
    summary: 'Housekeeping cleaning exceeds 35 min standard benchmark',
    details: 'Sanitization in progress. New patient awaiting transfer from emergency observation.',
    timestamp: '25 mins ago',
  },
  {
    id: 'ALT-104',
    title: 'Trauma Bay 04: Pediatric Circuit Check Pending',
    category: 'TRAUMA_BLOCK',
    severity: 'WARNING',
    status: 'NEW',
    department: 'Emergency & Trauma',
    resourceRef: 'BAY-04',
    summary: 'Ventilator test checklist flagged; coordinator signoff required',
    details: 'Bay 04 cannot be declared operational until authorized inspection is recorded.',
    timestamp: '18 mins ago',
  },
  {
    id: 'ALT-105',
    title: 'Night Shift Anesthesia Roster Shortfall',
    category: 'STAFFING_GAP',
    severity: 'CRITICAL',
    status: 'NEW',
    department: 'Anesthesia',
    summary: 'Uncovered shift from 23:00 to 07:00 for emergency OT coverage',
    details: 'Relief doctor required. Escalated to Chief of Clinical Operations.',
    timestamp: '30 mins ago',
  },
  {
    id: 'ALT-106',
    title: 'Lab Analyzer Calibration Cycle: ABG ABL90',
    category: 'LAB_CONFLICT',
    severity: 'INFO',
    status: 'RESOLVED',
    department: 'Critical Care Lab',
    resourceRef: 'LAB-ABG-05',
    summary: 'Routine sensor pack wash completed successfully',
    details: 'Quality control control values verified within standard deviations.',
    timestamp: '2 hours ago',
    resolvedBy: 'Tech Anita',
    resolvedAt: '1 hour ago',
    resolutionNote: 'Slope check passed. Analyzer returned to online status.',
  },
];

// ============================================================================
// Helper to Load & Save with fallback
// ============================================================================
function load<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.warn(`[HospitalFlow] Failed to parse ${key} from localStorage`, err);
  }
  return initial;
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[HospitalFlow] Failed to write ${key} to localStorage`, err);
  }
}

// ============================================================================
// Custom Hook for Global Operational State
// ============================================================================
export function useOperationsData() {
  const [labs, setLabs] = useState<LabInstrument[]>(() => load(KEYS.LABS, INITIAL_LAB_INSTRUMENTS));
  const [labReservations, setLabReservations] = useState<LabReservation[]>(() => load(KEYS.LAB_RESERVATIONS, INITIAL_LAB_RESERVATIONS));
  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => load(KEYS.EQUIPMENT, INITIAL_EQUIPMENT));
  const [equipmentBookings, setEquipmentBookings] = useState<EquipmentBooking[]>(() => load(KEYS.EQUIPMENT_BOOKINGS, INITIAL_EQUIPMENT_BOOKINGS));
  const [camps, setCamps] = useState<CampRecord[]>(() => load(KEYS.CAMPS, INITIAL_CAMPS));
  const [pharmacy, setPharmacy] = useState<PharmacyItem[]>(() => load(KEYS.PHARMACY, INITIAL_PHARMACY_ITEMS));
  const [pharmacyTransactions, setPharmacyTransactions] = useState<StockTransaction[]>(() => load(KEYS.PHARMACY_TX, INITIAL_STOCK_TRANSACTIONS));
  const [traumaBays, setTraumaBays] = useState<TraumaBay[]>(() => load(KEYS.TRAUMA, INITIAL_TRAUMA_BAYS));
  const [doctors, setDoctors] = useState<DoctorScheduleEntry[]>(() => load(KEYS.DOCTORS, INITIAL_DOCTORS));
  const [staff, setStaff] = useState<StaffMember[]>(() => load(KEYS.STAFF, INITIAL_STAFF));
  const [alerts, setAlerts] = useState<OperationalAlert[]>(() => load(KEYS.ALERTS, INITIAL_ALERTS));
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Synchronize to localStorage
  useEffect(() => { save(KEYS.LABS, labs); }, [labs]);
  useEffect(() => { save(KEYS.LAB_RESERVATIONS, labReservations); }, [labReservations]);
  useEffect(() => { save(KEYS.EQUIPMENT, equipment); }, [equipment]);
  useEffect(() => { save(KEYS.EQUIPMENT_BOOKINGS, equipmentBookings); }, [equipmentBookings]);
  useEffect(() => { save(KEYS.CAMPS, camps); }, [camps]);
  useEffect(() => { save(KEYS.PHARMACY, pharmacy); }, [pharmacy]);
  useEffect(() => { save(KEYS.PHARMACY_TX, pharmacyTransactions); }, [pharmacyTransactions]);
  useEffect(() => { save(KEYS.TRAUMA, traumaBays); }, [traumaBays]);
  useEffect(() => { save(KEYS.DOCTORS, doctors); }, [doctors]);
  useEffect(() => { save(KEYS.STAFF, staff); }, [staff]);
  useEffect(() => { save(KEYS.ALERTS, alerts); }, [alerts]);

  const triggerSync = useCallback(() => {
    setLastSyncTime(new Date());
  }, []);

  // --------------------------------------------------------------------------
  // B. Lab Actions with Conflict Detection
  // --------------------------------------------------------------------------
  const createLabReservation = useCallback((reservation: Omit<LabReservation, 'id' | 'status'>) => {
    // Conflict detection: prevent overlapping reservation for the same instrument on the same date
    const hasOverlap = labReservations.some(
      (r) =>
        r.instrumentId === reservation.instrumentId &&
        r.date === reservation.date &&
        r.status !== 'CANCELLED' &&
        !(reservation.endTime <= r.startTime || reservation.startTime >= r.endTime)
    );

    if (hasOverlap) {
      return { success: false, error: 'Conflicting reservation detected: This instrument is already booked for the selected time window.' };
    }

    const newRes: LabReservation = {
      ...reservation,
      id: `RES-LAB-${Date.now().toString().slice(-4)}`,
      status: 'SCHEDULED',
    };

    setLabReservations((prev) => [newRes, ...prev]);
    triggerSync();
    return { success: true, reservation: newRes };
  }, [labReservations, triggerSync]);

  const cancelLabReservation = useCallback((id: string) => {
    setLabReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r))
    );
    triggerSync();
  }, [triggerSync]);

  // --------------------------------------------------------------------------
  // C. Equipment Actions & Outage Reporting
  // --------------------------------------------------------------------------
  const bookEquipment = useCallback((booking: Omit<EquipmentBooking, 'id' | 'status'>) => {
    const item = equipment.find((e) => e.id === booking.equipmentId);
    if (!item) return { success: false, error: 'Equipment not found' };

    if (item.status === 'OUT_OF_SERVICE' || item.status === 'MAINTENANCE_DUE') {
      return { success: false, error: `Cannot book: Equipment is currently ${item.status.replace('_', ' ')}.` };
    }

    // Check for conflicting active bookings on same date
    const hasConflict = equipmentBookings.some(
      (b) =>
        b.equipmentId === booking.equipmentId &&
        b.date === booking.date &&
        b.status !== 'CANCELLED' &&
        b.status !== 'RELEASED'
    );

    if (hasConflict) {
      return { success: false, error: 'Conflicting booking exists for this equipment on the selected date.' };
    }

    const newBooking: EquipmentBooking = {
      ...booking,
      id: `BK-EQ-${Date.now().toString().slice(-4)}`,
      status: 'CONFIRMED',
    };

    setEquipmentBookings((prev) => [newBooking, ...prev]);
    setEquipment((prev) =>
      prev.map((e) =>
        e.id === booking.equipmentId
          ? { ...e, status: 'IN_USE', activeBookingId: newBooking.id }
          : e
      )
    );
    triggerSync();
    return { success: true, booking: newBooking };
  }, [equipment, equipmentBookings, triggerSync]);

  const reportEquipmentOutage = useCallback((equipmentId: string, reason: string) => {
    setEquipment((prev) =>
      prev.map((e) =>
        e.id === equipmentId
          ? {
              ...e,
              status: 'OUT_OF_SERVICE',
              blockerReason: reason,
              lastTelemetryTimestamp: `Outage logged: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            }
          : e
      )
    );

    // Auto-create alert
    const newAlert: OperationalAlert = {
      id: `ALT-EQ-${Date.now().toString().slice(-4)}`,
      title: `Equipment Outage: ${equipmentId}`,
      category: 'EQUIPMENT_DOWNTIME',
      severity: 'WARNING',
      status: 'NEW',
      department: 'Biomedical Operations',
      resourceRef: equipmentId,
      summary: reason,
      timestamp: 'Just now',
    };
    setAlerts((prev) => [newAlert, ...prev]);
    triggerSync();
  }, [triggerSync]);

  const restoreEquipment = useCallback((equipmentId: string) => {
    setEquipment((prev) =>
      prev.map((e) =>
        e.id === equipmentId
          ? {
              ...e,
              status: 'OPERATIONAL',
              blockerReason: undefined,
              lastTelemetryTimestamp: `Restored online: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            }
          : e
      )
    );
    triggerSync();
  }, [triggerSync]);

  // --------------------------------------------------------------------------
  // E. Health Camps Allocation
  // --------------------------------------------------------------------------
  const allocateCampResources = useCallback((campId: string, allocation: Omit<CampAllocation, 'id' | 'timestamp'>) => {
    const camp = camps.find((c) => c.id === campId);
    if (!camp) return { success: false, error: 'Camp record not found' };

    const remaining = camp.capacityUnits - camp.allocatedUnits;
    if (allocation.units > remaining) {
      return {
        success: false,
        error: `Allocation rejected: Requested ${allocation.units} units exceeds remaining camp capacity of ${remaining} units.`,
      };
    }

    const newAlloc: CampAllocation = {
      ...allocation,
      id: `ALC-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
    };

    const newAllocated = camp.allocatedUnits + allocation.units;
    setCamps((prev) =>
      prev.map((c) =>
        c.id === campId
          ? {
              ...c,
              allocatedUnits: newAllocated,
              allocations: [newAlloc, ...c.allocations],
            }
          : c
      )
    );
    triggerSync();
    return { success: true, remaining: camp.capacityUnits - newAllocated };
  }, [camps, triggerSync]);

  // --------------------------------------------------------------------------
  // F. Emergency Pharmacy Stock Adjustment (Strictly non-negative)
  // --------------------------------------------------------------------------
  const adjustPharmacyStock = useCallback((
    drugId: string,
    delta: number,
    reason: StockTransaction['reason'],
    actor: string,
    notes?: string
  ) => {
    const item = pharmacy.find((p) => p.id === drugId);
    if (!item) return { success: false, error: 'Item not found in inventory.' };

    const newStock = item.currentStock + delta;
    if (newStock < 0) {
      return {
        success: false,
        error: `Adjustment rejected: Dispensing ${Math.abs(delta)} units would result in negative stock (${newStock} ${item.unit}). Available: ${item.currentStock}.`,
      };
    }

    let status: PharmacyItem['status'] = 'NORMAL';
    if (newStock <= item.minThreshold * 0.5) {
      status = 'CRITICAL';
    } else if (newStock <= item.minThreshold) {
      status = 'LOW_STOCK';
    }

    const tx: StockTransaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      drugId,
      drugName: item.name,
      timestamp: 'Just now',
      actor,
      changeDelta: delta,
      previousStock: item.currentStock,
      newStock,
      reason,
      notes,
    };

    setPharmacy((prev) =>
      prev.map((p) =>
        p.id === drugId
          ? {
              ...p,
              currentStock: newStock,
              status,
              lastUpdated: 'Just now',
            }
          : p
      )
    );

    setPharmacyTransactions((prev) => [tx, ...prev]);

    // If stock became critical, raise or update alert
    if (status === 'CRITICAL') {
      const newAlert: OperationalAlert = {
        id: `ALT-PHARM-${Date.now().toString().slice(-4)}`,
        title: `Critical Stockout Alert: ${item.name}`,
        category: 'PHARMACY_STOCKOUT',
        severity: 'CRITICAL',
        status: 'NEW',
        department: 'Emergency Pharmacy',
        resourceRef: item.id,
        summary: `Stock dropped to ${newStock} ${item.unit} (Minimum safe threshold: ${item.minThreshold})`,
        details: `Reason: ${reason}. Recorded by ${actor}.`,
        timestamp: 'Just now',
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    triggerSync();
    return { success: true, newStock, status };
  }, [pharmacy, triggerSync]);

  // --------------------------------------------------------------------------
  // G. Emergency & Trauma Bay Actions
  // --------------------------------------------------------------------------
  const updateTraumaBayStatus = useCallback((
    bayId: string,
    newStatus: TraumaBay['status'],
    checklistUpdate?: Partial<TraumaBay['checklist']>,
    blockerReason?: string,
    inspector: string = 'Staff Nurse (Charge)'
  ) => {
    // Safety check: Cannot mark READY if any checklist item is false
    if (newStatus === 'READY' && checklistUpdate) {
      const allChecked = Object.values(checklistUpdate).every((v) => v === true);
      if (!allChecked) {
        return { success: false, error: 'Cannot mark bay READY: All resuscitation checklist equipment must pass operational verification.' };
      }
    }

    setTraumaBays((prev) =>
      prev.map((b) => {
        if (b.id !== bayId) return b;
        const updatedChecklist = checklistUpdate ? { ...b.checklist, ...checklistUpdate } : b.checklist;
        return {
          ...b,
          status: newStatus,
          checklist: updatedChecklist,
          blockerReason: newStatus === 'READY' ? undefined : blockerReason || b.blockerReason,
          lastUpdated: 'Just now',
          lastInspector: inspector,
        };
      })
    );
    triggerSync();
    return { success: true };
  }, [triggerSync]);

  // --------------------------------------------------------------------------
  // H. Doctor Schedule Roster
  // --------------------------------------------------------------------------
  const updateDoctorStatus = useCallback((doctorId: string, status: DoctorScheduleEntry['status']) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, status } : d))
    );
    triggerSync();
  }, [triggerSync]);

  // --------------------------------------------------------------------------
  // I. Staff Status Update
  // --------------------------------------------------------------------------
  const updateStaffStatus = useCallback((staffId: string, status: StaffMember['status']) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status } : s))
    );
    triggerSync();
  }, [triggerSync]);

  // --------------------------------------------------------------------------
  // J. Operational Alerts Management
  // --------------------------------------------------------------------------
  const acknowledgeAlert = useCallback((alertId: string, actor: string = 'Coordinator') => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId && a.status === 'NEW'
          ? {
              ...a,
              status: 'ACKNOWLEDGED',
              acknowledgedBy: actor,
              acknowledgedAt: 'Just now',
            }
          : a
      )
    );
    triggerSync();
  }, [triggerSync]);

  const resolveAlert = useCallback((alertId: string, note: string, actor: string = 'Coordinator') => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: 'RESOLVED',
              resolvedBy: actor,
              resolvedAt: 'Just now',
              resolutionNote: note,
            }
          : a
      )
    );
    triggerSync();
  }, [triggerSync]);

  // --------------------------------------------------------------------------
  // Global Reset
  // --------------------------------------------------------------------------
  const resetAllOperationalData = useCallback(() => {
    setLabs(INITIAL_LAB_INSTRUMENTS);
    setLabReservations(INITIAL_LAB_RESERVATIONS);
    setEquipment(INITIAL_EQUIPMENT);
    setEquipmentBookings(INITIAL_EQUIPMENT_BOOKINGS);
    setCamps(INITIAL_CAMPS);
    setPharmacy(INITIAL_PHARMACY_ITEMS);
    setPharmacyTransactions(INITIAL_STOCK_TRANSACTIONS);
    setTraumaBays(INITIAL_TRAUMA_BAYS);
    setDoctors(INITIAL_DOCTORS);
    setStaff(INITIAL_STAFF);
    setAlerts(INITIAL_ALERTS);

    save(KEYS.LABS, INITIAL_LAB_INSTRUMENTS);
    save(KEYS.LAB_RESERVATIONS, INITIAL_LAB_RESERVATIONS);
    save(KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
    save(KEYS.EQUIPMENT_BOOKINGS, INITIAL_EQUIPMENT_BOOKINGS);
    save(KEYS.CAMPS, INITIAL_CAMPS);
    save(KEYS.PHARMACY, INITIAL_PHARMACY_ITEMS);
    save(KEYS.PHARMACY_TX, INITIAL_STOCK_TRANSACTIONS);
    save(KEYS.TRAUMA, INITIAL_TRAUMA_BAYS);
    save(KEYS.DOCTORS, INITIAL_DOCTORS);
    save(KEYS.STAFF, INITIAL_STAFF);
    save(KEYS.ALERTS, INITIAL_ALERTS);

    triggerSync();
  }, [triggerSync]);

  return {
    labs,
    labReservations,
    createLabReservation,
    cancelLabReservation,
    equipment,
    equipmentBookings,
    bookEquipment,
    reportEquipmentOutage,
    restoreEquipment,
    camps,
    allocateCampResources,
    pharmacy,
    pharmacyTransactions,
    adjustPharmacyStock,
    traumaBays,
    updateTraumaBayStatus,
    doctors,
    updateDoctorStatus,
    staff,
    updateStaffStatus,
    alerts,
    acknowledgeAlert,
    resolveAlert,
    resetAllOperationalData,
    lastSyncTime,
    triggerSync,
  };
}
