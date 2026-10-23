import { useEffect, useState } from 'react';
import type { SetStateAction } from 'react';
import {
  Activity,
  AlertTriangle,
  Bed,
  BellRing,
  Boxes,
  Check,
  ClipboardList,
  Clock3,
  HeartPulse,
  Plus,
  ShieldAlert,
  Stethoscope,
  Users,
  UserRoundCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './ScenarioWorkspace.css';

type PanelHeaderProps = { eyebrow: string; title: string; description: string; icon: LucideIcon };

function PanelHeader({ eyebrow, title, description, icon: Icon }: PanelHeaderProps) {
  return (
    <div className="scenario-heading">
      <div className="scenario-heading-icon"><Icon size={22} aria-hidden="true" /></div>
      <div>
        <p className="scenario-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="scenario-description">{description}</p>
      </div>
    </div>
  );
}

function useLocalRecords<T>(key: string, initialValue: () => T): [T, (value: SetStateAction<T>) => void] {
  const [records, setRecords] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : initialValue();
    } catch {
      return initialValue();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(records));
    } catch {
      // Keep this session usable if browser storage is unavailable.
    }
  }, [key, records]);

  return [records, setRecords];
}

function SummaryMetric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <div className={`scenario-metric metric-${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function StateTag({ children, tone = 'neutral' }: { children: string; tone?: string }) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}

function SectionTitle({ label, title, trailing }: { label: string; title: string; trailing?: string }) {
  return <div className="panel-heading"><div><p className="panel-kicker">{label}</p><h3>{title}</h3></div>{trailing && <span className="panel-count">{trailing}</span>}</div>;
}

type Medicine = { id: string; name: string; category: string; quantity: number; parLevel: number; unit: string };

const initialMedicines: Medicine[] = [
  { id: 'epi', name: 'Epinephrine injection', category: 'Emergency medicine', quantity: 18, parLevel: 24, unit: 'ampoules' },
  { id: 'saline', name: 'Normal saline 500 ml', category: 'IV fluids', quantity: 42, parLevel: 30, unit: 'bags' },
  { id: 'oxygen', name: 'Oxygen mask kit', category: 'Airway & oxygen', quantity: 11, parLevel: 16, unit: 'kits' },
  { id: 'dressing', name: 'Trauma dressing pack', category: 'Emergency supplies', quantity: 9, parLevel: 12, unit: 'packs' },
  { id: 'airway', name: 'Adult airway set', category: 'Airway & oxygen', quantity: 14, parLevel: 8, unit: 'sets' },
];

export function PharmacyWorkspace() {
  const [items, setItems] = useLocalRecords<Medicine[]>('hospital-flow-pharmacy-v1', () => initialMedicines);
  const lowStock = items.filter((item) => item.quantity < item.parLevel).length;
  const totalUnits = items.reduce((total, item) => total + item.quantity, 0);

  function receiveStock(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 10 } : item));
  }

  return (
    <section className="scenario-workspace">
      <PanelHeader eyebrow="EMERGENCY SUPPLY" title="Pharmacy & emergency tools" description="Track critical medicines and resuscitation supplies. Low-stock items are flagged for replenishment." icon={Boxes} />
      <div className="scenario-metrics">
        <SummaryMetric label="Tracked items" value={String(items.length)} note="Emergency inventory" tone="blue" />
        <SummaryMetric label="Units on hand" value={String(totalUnits)} note="Across tracked items" tone="mint" />
        <SummaryMetric label="Below par level" value={String(lowStock)} note={lowStock ? 'Replenishment needed' : 'Stock levels healthy'} tone={lowStock ? 'coral' : 'gold'} />
      </div>
      <section className="workflow-panel full-panel">
        <SectionTitle label="PHARMACY INVENTORY" title="Emergency medicines & tools" trailing={`${lowStock} reorder flags`} />
        <div className="table-scroll"><table className="workflow-table emergency-table"><thead><tr><th>Supply</th><th>Category</th><th>On hand</th><th>Par level</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {items.map((item) => {
            const low = item.quantity < item.parLevel;
            return <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td>{item.quantity} {item.unit}</td><td>{item.parLevel} {item.unit}</td><td><StateTag tone={low ? 'maintenance' : 'confirmed'}>{low ? 'Reorder' : 'In stock'}</StateTag></td><td><button type="button" className="btn btn-secondary btn-sm" onClick={() => receiveStock(item.id)} aria-label={`Receive 10 ${item.unit} of ${item.name}`}><Plus size={14} /> Receive 10</button></td></tr>;
          })}
        </tbody></table></div>
        <div className="panel-footnote"><ShieldAlert size={15} /> Demo inventory only. Confirm quantities against the hospital pharmacy system.</div>
      </section>
    </section>
  );
}

type BayStatus = 'Available' | 'In use' | 'Cleaning';
type TraumaBay = { id: string; name: string; zone: string; status: BayStatus };
const bayTransitions: Record<BayStatus, { label: string; next: BayStatus }> = {
  Available: { label: 'Start case', next: 'In use' },
  'In use': { label: 'Send to cleaning', next: 'Cleaning' },
  Cleaning: { label: 'Mark ready', next: 'Available' },
};

const initialBays: TraumaBay[] = [
  { id: 'T-01', name: 'Trauma bay 01', zone: 'Resuscitation', status: 'In use' },
  { id: 'T-02', name: 'Trauma bay 02', zone: 'Resuscitation', status: 'Available' },
  { id: 'T-03', name: 'Trauma bay 03', zone: 'Major injuries', status: 'Cleaning' },
  { id: 'T-04', name: 'Trauma bay 04', zone: 'Major injuries', status: 'Available' },
  { id: 'E-05', name: 'Observation bed 05', zone: 'Emergency ward', status: 'In use' },
  { id: 'E-06', name: 'Observation bed 06', zone: 'Emergency ward', status: 'Available' },
];

export function TraumaWorkspace() {
  const [bays, setBays] = useLocalRecords<TraumaBay[]>('hospital-flow-trauma-bays-v1', () => initialBays);
  const available = bays.filter((bay) => bay.status === 'Available').length;
  const inUse = bays.filter((bay) => bay.status === 'In use').length;
  const cleaning = bays.filter((bay) => bay.status === 'Cleaning').length;

  function advanceBay(id: string) {
    setBays((current) => current.map((bay) => bay.id === id ? { ...bay, status: bayTransitions[bay.status].next } : bay));
  }

  return (
    <section className="scenario-workspace">
      <PanelHeader eyebrow="EMERGENCY DEPARTMENT" title="Emergency & trauma centre" description="See resuscitation bays and emergency ward beds by readiness. Advance each space through care, cleaning, and ready." icon={HeartPulse} />
      <div className="scenario-metrics">
        <SummaryMetric label="Ready now" value={`${available}`} note="Available bays & beds" tone="mint" />
        <SummaryMetric label="In use" value={`${inUse}`} note="Active care spaces" tone="coral" />
        <SummaryMetric label="Being cleaned" value={`${cleaning}`} note="Not yet ready" tone="gold" />
      </div>
      <section className="workflow-panel full-panel">
        <SectionTitle label="LIVE CAPACITY" title="Emergency spaces" trailing={`${available} of ${bays.length} ready`} />
        <div className="trauma-grid">{bays.map((bay) => <article className="trauma-bay" key={bay.id}>
          <div className={`trauma-bay-mark bay-${bay.status.toLowerCase().replace(' ', '-')}`}><Bed size={19} /></div>
          <div className="trauma-bay-copy"><strong>{bay.name}</strong><small>{bay.id} · {bay.zone}</small></div>
          <StateTag tone={bay.status === 'Available' ? 'confirmed' : bay.status === 'Cleaning' ? 'maintenance' : 'neutral'}>{bay.status}</StateTag>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => advanceBay(bay.id)}>{bayTransitions[bay.status].label}</button>
        </article>)}</div>
        <div className="panel-footnote"><Activity size={15} /> Use synthetic operational states only. Patient or case details are not shown here.</div>
      </section>
    </section>
  );
}

type Clinician = { id: string; name: string; specialty: string; shift: string; status: 'Available' | 'With patient' | 'On call' | 'Off shift' };
const initialClinicians: Clinician[] = [
  { id: 'DR-01', name: 'Dr. Meera S.', specialty: 'Emergency medicine', shift: '08:00–16:00', status: 'Available' },
  { id: 'DR-02', name: 'Dr. Arjun K.', specialty: 'Trauma surgery', shift: '08:00–20:00', status: 'With patient' },
  { id: 'DR-03', name: 'Dr. Sara P.', specialty: 'Radiology', shift: '10:00–18:00', status: 'Available' },
  { id: 'DR-04', name: 'Dr. Nikhil R.', specialty: 'Anaesthesia', shift: '12:00–20:00', status: 'On call' },
  { id: 'DR-05', name: 'Dr. Leena D.', specialty: 'Emergency medicine', shift: '20:00–08:00', status: 'Off shift' },
];
const clinicianStatuses: Clinician['status'][] = ['Available', 'With patient', 'On call', 'Off shift'];

export function CliniciansWorkspace() {
  const [clinicians, setClinicians] = useLocalRecords<Clinician[]>('hospital-flow-clinicians-v1', () => initialClinicians);
  const available = clinicians.filter((person) => person.status === 'Available').length;
  const onCall = clinicians.filter((person) => person.status === 'On call').length;

  function updateStatus(id: string, status: Clinician['status']) {
    setClinicians((current) => current.map((person) => person.id === id ? { ...person, status } : person));
  }

  return (
    <section className="scenario-workspace">
      <PanelHeader eyebrow="CLINICAL COVERAGE" title="Doctor availability & schedule" description="Check clinician status, specialty, and shift times to coordinate emergency coverage." icon={Stethoscope} />
      <div className="scenario-metrics">
        <SummaryMetric label="Available now" value={String(available)} note="Ready for assignment" tone="mint" />
        <SummaryMetric label="On call" value={String(onCall)} note="Reachable for escalation" tone="blue" />
        <SummaryMetric label="On today's roster" value={String(clinicians.length)} note="Across emergency services" tone="gold" />
      </div>
      <section className="workflow-panel full-panel">
        <SectionTitle label="ON-CALL ROSTER" title="Emergency clinicians" trailing="Local demo schedule" />
        <div className="roster-list">{clinicians.map((person) => <article className="roster-row" key={person.id}>
          <span className="roster-avatar"><UserRoundCheck size={18} /></span>
          <div className="roster-person"><strong>{person.name}</strong><small>{person.specialty} · {person.id}</small></div>
          <div className="roster-shift"><Clock3 size={14} /> {person.shift}</div>
          <label className="roster-status"><span className="sr-only">{person.name} availability</span><select value={person.status} onChange={(event) => updateStatus(person.id, event.target.value as Clinician['status'])}>{clinicianStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        </article>)}</div>
        <div className="panel-footnote"><ShieldAlert size={15} /> Synthetic roster. Verify real-time duty schedules through hospital administration.</div>
      </section>
    </section>
  );
}

type DepartmentCoverage = { id: string; department: string; staffed: number; required: number; roles: string };
const departments: DepartmentCoverage[] = [
  { id: 'ed', department: 'Emergency department', staffed: 8, required: 10, roles: 'Nursing · triage · support' },
  { id: 'trauma', department: 'Trauma centre', staffed: 6, required: 6, roles: 'Trauma team · theatre support' },
  { id: 'imaging', department: 'Imaging', staffed: 4, required: 5, roles: 'Radiographers · technicians' },
  { id: 'lab', department: 'Laboratory', staffed: 5, required: 5, roles: 'Lab technicians · phlebotomy' },
  { id: 'pharmacy', department: 'Emergency pharmacy', staffed: 2, required: 3, roles: 'Pharmacists · dispensary support' },
];

export function StaffWorkspace() {
  const onDuty = departments.reduce((total, department) => total + department.staffed, 0);
  const required = departments.reduce((total, department) => total + department.required, 0);
  const shortDepartments = departments.filter((department) => department.staffed < department.required).length;

  return (
    <section className="scenario-workspace">
      <PanelHeader eyebrow="SHIFT COVERAGE" title="Staff availability" description="Review on-duty coverage across emergency, trauma, imaging, laboratory, and pharmacy teams." icon={Users} />
      <div className="scenario-metrics">
        <SummaryMetric label="On duty" value={String(onDuty)} note="Across listed departments" tone="mint" />
        <SummaryMetric label="Planned coverage" value={String(required)} note="Current shift requirement" tone="blue" />
        <SummaryMetric label="Below requirement" value={String(shortDepartments)} note="Departments to review" tone={shortDepartments ? 'coral' : 'gold'} />
      </div>
      <section className="workflow-panel full-panel">
        <SectionTitle label="HOSPITAL-WIDE VIEW" title="Department coverage" trailing="Current shift" />
        <div className="coverage-list">{departments.map((department) => {
          const percentage = Math.min(100, Math.round(department.staffed / department.required * 100));
          const short = department.staffed < department.required;
          return <article className="coverage-row" key={department.id}>
            <div className="coverage-head"><div><strong>{department.department}</strong><small>{department.roles}</small></div><span className={`coverage-count${short ? ' is-short' : ''}`}>{department.staffed}<span> / {department.required}</span></span></div>
            <div className="utilization-track coverage-track"><span className={short ? 'coverage-low' : ''} style={{ width: `${percentage}%` }} /></div>
            <div className="coverage-foot"><span>{percentage}% covered</span>{short && <StateTag tone="maintenance">Coverage gap</StateTag>}</div>
          </article>;
        })}</div>
        <div className="panel-footnote"><Users size={15} /> Staffing totals are synthetic planning examples, not a live HR feed.</div>
      </section>
    </section>
  );
}

type OperationalAlert = { id: string; severity: 'Urgent' | 'High' | 'Info'; area: string; title: string; detail: string; time: string; acknowledged: boolean };
const initialAlerts: OperationalAlert[] = [
  { id: 'alert-stock', severity: 'High', area: 'Pharmacy', title: 'Epinephrine below par level', detail: '18 ampoules available; target stock is 24.', time: '4 min ago', acknowledged: false },
  { id: 'alert-trauma', severity: 'Urgent', area: 'Trauma centre', title: 'Resuscitation bay 01 in use', detail: 'One of two resuscitation bays is currently occupied.', time: '8 min ago', acknowledged: false },
  { id: 'alert-imaging', severity: 'High', area: 'Imaging', title: 'Portable ultrasound maintenance', detail: 'Unavailable today; expected back tomorrow at 08:00.', time: '21 min ago', acknowledged: false },
  { id: 'alert-staff', severity: 'Info', area: 'Staffing', title: 'Emergency department coverage gap', detail: '8 of 10 planned staff are on duty for this shift.', time: '32 min ago', acknowledged: false },
  { id: 'alert-lab', severity: 'Info', area: 'Diagnostics', title: 'MRI schedule has open capacity', detail: 'Next available emergency imaging window is shown in Lab availability.', time: '46 min ago', acknowledged: true },
];

export function AlertsWorkspace() {
  const [alerts, setAlerts] = useLocalRecords<OperationalAlert[]>('hospital-flow-alerts-v1', () => initialAlerts);
  const [filter, setFilter] = useState<'All' | OperationalAlert['severity']>('All');
  const active = alerts.filter((alert) => !alert.acknowledged).length;
  const visibleAlerts = alerts.filter((alert) => filter === 'All' || alert.severity === filter);

  function acknowledge(id: string) {
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, acknowledged: true } : alert));
  }
  function acknowledgeAll() {
    setAlerts((current) => current.map((alert) => ({ ...alert, acknowledged: true })));
  }

  return (
    <section className="scenario-workspace">
      <PanelHeader eyebrow="OPERATIONS FEED" title="General alerts" description="A shared view of pharmacy, trauma, equipment, diagnostics, and staffing issues that need attention." icon={BellRing} />
      <div className="scenario-metrics">
        <SummaryMetric label="Needs attention" value={String(active)} note="Unacknowledged alerts" tone={active ? 'coral' : 'mint'} />
        <SummaryMetric label="Urgent" value={String(alerts.filter((alert) => !alert.acknowledged && alert.severity === 'Urgent').length)} note="Escalate now" tone="coral" />
        <SummaryMetric label="All alerts" value={String(alerts.length)} note="Across operations" tone="blue" />
      </div>
      <section className="workflow-panel full-panel">
        <div className="panel-heading alerts-heading"><div><p className="panel-kicker">CROSS-TEAM NOTIFICATIONS</p><h3>Operational alerts</h3></div><button type="button" className="btn btn-secondary btn-sm" onClick={acknowledgeAll} disabled={active === 0}><Check size={14} /> Acknowledge all</button></div>
        <div className="alert-toolbar" role="group" aria-label="Filter alerts">{(['All', 'Urgent', 'High', 'Info'] as const).map((severity) => <button key={severity} type="button" className={`alert-filter${filter === severity ? ' is-selected' : ''}`} onClick={() => setFilter(severity)}>{severity}{severity === 'All' ? ` · ${alerts.length}` : ` · ${alerts.filter((alert) => alert.severity === severity).length}`}</button>)}</div>
        <div className="ops-alert-list">{visibleAlerts.map((alert) => <article className={`ops-alert${alert.acknowledged ? ' is-acknowledged' : ''}`} key={alert.id}>
          <div className={`ops-alert-icon severity-${alert.severity.toLowerCase()}`}>{alert.severity === 'Urgent' ? <AlertTriangle size={18} /> : alert.severity === 'High' ? <ShieldAlert size={18} /> : <ClipboardList size={18} />}</div>
          <div className="ops-alert-copy"><div className="ops-alert-top"><StateTag tone={alert.severity === 'Urgent' || alert.severity === 'High' ? 'maintenance' : 'neutral'}>{alert.severity}</StateTag><span>{alert.area} · {alert.time}</span></div><strong>{alert.title}</strong><p>{alert.detail}</p></div>
          <div className="ops-alert-action">{alert.acknowledged ? <StateTag tone="confirmed">Acknowledged</StateTag> : <button type="button" className="btn btn-secondary btn-sm" onClick={() => acknowledge(alert.id)}><Check size={14} /> Acknowledge</button>}</div>
        </article>)}</div>
        {visibleAlerts.length === 0 && <p className="scenario-empty">No alerts match this filter.</p>}
        <div className="panel-footnote"><BellRing size={15} /> Demo alerts are examples. Connect hospital systems for live notifications.</div>
      </section>
    </section>
  );
}
