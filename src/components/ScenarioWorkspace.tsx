import { useState } from 'react';
import type { FormEvent, ReactNode, SetStateAction } from 'react';
import { useFacilityData } from '../context/FacilityDataContext';
import DotGrid from './DotGrid';
import {
  AlertTriangle,
  Biohazard,
  ArrowRight,
  BellRing,
  Bed,
  Boxes,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplets,
  HeartPulse,
  FlaskConical,
  Hospital,
  Layers3,
  PackageCheck,
  Plus,
  ShieldCheck,
  Stethoscope,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import {
  AlertsWorkspace,
  AmbulanceWorkspace,
  BloodBankWorkspace,
  CliniciansWorkspace,
  InfectionControlWorkspace,
  PharmacyWorkspace,
  StaffWorkspace,
  TraumaWorkspace,
} from './EmergencyWorkspaces';
import { OccupancyWorkspace } from './OccupancyWorkspace';
import './ScenarioWorkspace.css';

export type ScenarioRoute = 'home' | 'labs' | 'equipment' | 'beds' | 'occupancy' | 'camps' | 'pharmacy' | 'trauma' | 'clinicians' | 'staff' | 'alerts' | 'blood-bank' | 'ambulance' | 'infection-control';

const routePaths: Record<ScenarioRoute, string> = {
  home: '/',
  labs: '/labs',
  equipment: '/equipment',
  beds: '/beds',
  occupancy: '/occupancy',
  camps: '/camps',
  pharmacy: '/pharmacy',
  trauma: '/trauma',
  clinicians: '/clinicians',
  staff: '/staff',
  alerts: '/alerts',
  'blood-bank': '/blood-bank',
  ambulance: '/ambulance',
  'infection-control': '/infection-control',
};

const scenarios = [
  { id: 'labs', title: 'Lab availability', detail: 'Reserve diagnostic slots and resolve schedule conflicts.', icon: FlaskConical, tone: 'mint', path: routePaths.labs },
  { id: 'equipment', title: 'Equipment booking', detail: 'Book shared equipment and see maintenance outages.', icon: Wrench, tone: 'blue', path: routePaths.equipment },
  { id: 'beds', title: 'Clinic beds', detail: 'Coordinate housekeeping, review, and room readiness.', icon: Bed, tone: 'coral', path: routePaths.beds },
  { id: 'occupancy', title: 'Bed occupancy', detail: 'Track ward capacity, crew assignments, and bed readiness.', icon: Bed, tone: 'mint', path: '/occupancy' },
  { id: 'camps', title: 'Health camp', detail: 'Allocate resource units against camp capacity.', icon: Stethoscope, tone: 'gold', path: routePaths.camps },
  { id: 'pharmacy', title: 'Emergency pharmacy', detail: 'Monitor critical medicines, tools, and low-stock supplies.', icon: Boxes, tone: 'coral', path: routePaths.pharmacy },
  { id: 'trauma', title: 'Emergency & trauma', detail: 'See room readiness and available trauma bays at a glance.', icon: HeartPulse, tone: 'mint', path: routePaths.trauma },
  { id: 'clinicians', title: 'Doctor schedule', detail: 'Review on-duty clinicians and upcoming coverage.', icon: CalendarClock, tone: 'blue', path: routePaths.clinicians },
  { id: 'staff', title: 'Staff availability', detail: 'Check shift coverage across hospital departments.', icon: Users, tone: 'gold', path: routePaths.staff },
  { id: 'alerts', title: 'General alerts', detail: 'Review and acknowledge cross-team operational issues.', icon: BellRing, tone: 'coral', path: routePaths.alerts },
  { id: 'blood-bank', title: 'Blood bank', detail: 'Review blood group and product availability for coordination.', icon: Droplets, tone: 'coral', path: routePaths['blood-bank'] },
  { id: 'ambulance', title: 'Ambulance arrivals', detail: 'Coordinate incoming emergency vehicles and handover readiness.', icon: Truck, tone: 'blue', path: routePaths.ambulance },
  { id: 'infection-control', title: 'Isolation & infection control', detail: 'Check isolation room availability and cleaning status.', icon: Biohazard, tone: 'mint', path: routePaths['infection-control'] },
] as const;

const navigationItems = [
  { id: 'home', title: 'All workflows', icon: Layers3, path: routePaths.home },
  { id: 'labs', title: 'Labs', icon: FlaskConical, path: routePaths.labs },
  { id: 'equipment', title: 'Equipment', icon: Wrench, path: routePaths.equipment },
  { id: 'beds', title: 'Clinic beds', icon: Bed, path: routePaths.beds },
  { id: 'occupancy', title: 'Occupancy', icon: Bed, path: '/occupancy' },
  { id: 'camps', title: 'Health camps', icon: Stethoscope, path: routePaths.camps },
  { id: 'pharmacy', title: 'Pharmacy', icon: Boxes, path: routePaths.pharmacy },
  { id: 'trauma', title: 'Trauma', icon: HeartPulse, path: routePaths.trauma },
  { id: 'clinicians', title: 'Doctors', icon: CalendarClock, path: routePaths.clinicians },
  { id: 'staff', title: 'Staff', icon: Users, path: routePaths.staff },
  { id: 'alerts', title: 'Alerts', icon: BellRing, path: routePaths.alerts },
  { id: 'blood-bank', title: 'Blood bank', icon: Droplets, path: routePaths['blood-bank'] },
  { id: 'ambulance', title: 'Ambulances', icon: Truck, path: routePaths.ambulance },
  { id: 'infection-control', title: 'Isolation', icon: Biohazard, path: routePaths['infection-control'] },
] as const;

export function ScenarioNavigation({ currentRoute }: { currentRoute: ScenarioRoute }) {
  return (
    <nav className="scenario-nav" aria-label="Hospital workflows">
      <div className="scenario-nav-inner">
        {navigationItems.map(({ id, title, icon: Icon, path }) => (
          <a
            key={id}
            className={`scenario-nav-link${currentRoute === id ? ' is-active' : ''}`}
            href={path}
            aria-current={currentRoute === id ? 'page' : undefined}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{title}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}

type LabReservation = {
  id: string;
  test: string;
  date: string;
  time: string;
  department: string;
};

type EquipmentBooking = {
  id: string;
  equipmentId: string;
  date: string;
  time: string;
  hours: number;
  department: string;
};

type CampAllocation = {
  id: string;
  resource: string;
  units: number;
  department: string;
};

function todayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function localTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function usePersistentState<T>(key: string, initialValue: () => T): [T, (value: SetStateAction<T>) => void] {
  return useFacilityData(key, initialValue);
}

function PageHeading({ eyebrow, title, description, icon: Icon }: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
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

function Metric({ label, value, note, tone = 'neutral' }: { label: string; value: string; note: string; tone?: string }) {
  return (
    <div className={`scenario-metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="scenario-empty">{children}</p>;
}

function ScenarioHome() {
  const [dateLabel] = useState(() => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));

  return (
    <section className="scenario-home">
      <div className="home-intro">
        <DotGrid
          className="home-intro-dots"
          baseColor="#72948b"
          activeColor="#0f766e"
          dotSize={3}
          gap={20}
          proximity={120}
          strength={0.22}
          bounce={0.35}
          tension={0.2}
          shockRadius={190}
          shockStrength={1}
          swell={0.3}
          stretch={0.15}
          glow={0.1}
          fade={0.55}
          opacity={0.32}
          clickShock={false}
        />
        <div>
          <p className="scenario-eyebrow">OPERATIONS DESK <span>•</span> TODAY</p>
          <h2>Where do you need to coordinate?</h2>
          <p>Choose a workflow to check availability, make a reservation, or allocate resources.</p>
        </div>
        <div className="home-date"><CalendarClock size={17} /> {dateLabel}</div>
      </div>
      <div className="scenario-card-grid">
        {scenarios.map(({ id, title, detail, icon: Icon, tone, path }) => (
          <a className="scenario-card" href={path} key={id}>
            <span className={`scenario-card-icon tone-${tone}`}><Icon size={21} aria-hidden="true" /></span>
            <span className="scenario-card-copy">
              <strong>{title}</strong>
              <small>{detail}</small>
            </span>
            <ChevronRight size={19} className="scenario-card-arrow" aria-hidden="true" />
          </a>
        ))}
      </div>
      <div className="home-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>Operational coordination only. Use synthetic information; do not enter patient-identifying data.</span>
      </div>
    </section>
  );
}

const labTimes = ['08:30', '09:30', '10:30', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const labTests = ['Complete blood count', 'Basic metabolic panel', 'Liver function panel', 'Thyroid profile', 'X-ray', 'CT scan', 'MRI scan', 'Ultrasound scan'];

function LabWorkspace() {
  const [reservations, setReservations] = usePersistentState<LabReservation[]>('hospital-flow-lab-reservations-v1', () => [
    { id: 'lab-seed-1', test: 'Complete blood count', date: todayDate(), time: '09:30', department: 'Outpatient clinic' },
    { id: 'lab-seed-2', test: 'Basic metabolic panel', date: todayDate(), time: '11:30', department: 'Emergency department' },
  ]);
  const [test, setTest] = useState(labTests[0]);
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(() => labTimes.find((slot) => slot > localTime() && slot !== '09:30' && slot !== '11:30') ?? labTimes[0]);
  const [department, setDepartment] = useState('Outpatient clinic');
  const [conflict, setConflict] = useState('');
  const [notice, setNotice] = useState('');
  const slotTaken = reservations.some((reservation) => reservation.date === date && reservation.time === time);
  const availableTimes = labTimes.filter((slot) => (date !== todayDate() || slot > localTime()) && !reservations.some((reservation) => reservation.date === date && reservation.time === slot));
  const nextTime = availableTimes[0];

  function reserveSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (slotTaken) {
      setConflict(`${time} is already reserved. The conflict has been flagged; choose the next available slot to continue.`);
      setNotice('');
      return;
    }
    setReservations((current) => [{ id: `lab-${Date.now()}`, test, date, time, department: department.trim() || 'Unassigned department' }, ...current]);
    setConflict('');
    setNotice(`Lab slot reserved for ${time}.`);
  }

  function useNextSlot() {
    if (nextTime) {
      setTime(nextTime);
      setConflict('');
      setNotice(`Next available slot is ${nextTime}. Confirm the reservation when ready.`);
    }
  }

  return (
    <section className="scenario-workspace">
      <PageHeading eyebrow="EMERGENCY DIAGNOSTICS" title="Lab availability" description="Coordinate urgent lab tests and imaging, including X-ray, CT, MRI, and ultrasound." icon={FlaskConical} />
      <div className="scenario-metrics">
        <Metric label="Available slots" value={String(availableTimes.length)} note="For selected date" tone="mint" />
        <Metric label="Reservations" value={String(reservations.filter((item) => item.date === date).length)} note="For selected date" tone="blue" />
        <Metric label="Next open slot" value={nextTime ?? 'Full'} note={date === todayDate() ? 'Today' : 'Selected date'} tone="gold" />
      </div>
      <div className="workflow-columns">
        <section className="workflow-panel booking-panel">
          <div className="panel-heading"><div><p className="panel-kicker">NEW RESERVATION</p><h3>Reserve a lab slot</h3></div><span className="step-mark">01</span></div>
          <form className="workflow-form" onSubmit={reserveSlot}>
            <label>Test or service<select value={test} onChange={(event) => setTest(event.target.value)}>{labTests.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="form-pair">
              <label>Date<input type="date" value={date} min={todayDate()} onChange={(event) => { setDate(event.target.value); setConflict(''); setNotice(''); const next = labTimes.find((slot) => (event.target.value !== todayDate() || slot > localTime()) && !reservations.some((reservation) => reservation.date === event.target.value && reservation.time === slot)); if (next) setTime(next); }} required /></label>
              <label>Time<select value={time} onChange={(event) => { setTime(event.target.value); setConflict(''); setNotice(''); }}>{labTimes.map((slot) => <option key={slot} value={slot}>{slot}{reservations.some((reservation) => reservation.date === date && reservation.time === slot) ? ' · booked' : ''}</option>)}</select></label>
            </div>
            <label>Requesting department<input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. Outpatient clinic" maxLength={60} /></label>
            {conflict && <div className="inline-alert alert-warning" role="alert"><AlertTriangle size={18} /><span>{conflict}</span></div>}
            {notice && <div className="inline-alert alert-success" role="status"><CheckCircle2 size={18} /><span>{notice}</span></div>}
            <div className="form-actions">
              <button className="btn btn-primary" type="submit"><CalendarClock size={16} /> Reserve slot</button>
              {conflict && nextTime && <button className="btn btn-secondary" type="button" onClick={useNextSlot}>Use {nextTime} <ArrowRight size={15} /></button>}
            </div>
          </form>
        </section>
        <section className="workflow-panel schedule-panel">
          <div className="panel-heading"><div><p className="panel-kicker">SCHEDULE</p><h3>Reserved lab slots</h3></div><span className="panel-count">{reservations.filter((item) => item.date === date).length} booked</span></div>
          {reservations.filter((item) => item.date === date).length ? (
            <div className="table-scroll"><table className="workflow-table"><thead><tr><th>Time</th><th>Test</th><th>Department</th><th>Status</th></tr></thead><tbody>
              {reservations.filter((item) => item.date === date).sort((a, b) => a.time.localeCompare(b.time)).map((reservation) => <tr key={reservation.id}><td><strong>{reservation.time}</strong></td><td>{reservation.test}</td><td>{reservation.department}</td><td><span className="status-pill status-confirmed"><Check size={13} /> Reserved</span></td></tr>)}
            </tbody></table></div>
          ) : <EmptyState>No slots are reserved for this date yet.</EmptyState>}
          <div className="panel-footnote"><Clock3 size={15} /> Slots are shown in local hospital time.</div>
        </section>
      </div>
    </section>
  );
}

const equipment = [
  { id: 'ultrasound', name: 'Portable ultrasound', location: 'Imaging · Level 2', maintenance: 'Maintenance outage · Available tomorrow at 08:00' },
  { id: 'ecg', name: '12-lead ECG', location: 'Diagnostics · Level 1', maintenance: '' },
  { id: 'monitor', name: 'Transport monitor', location: 'Emergency · Level 1', maintenance: '' },
  { id: 'infusion', name: 'Infusion pump set', location: 'Ward equipment pool', maintenance: '' },
] as const;

const equipmentCategories = [
  {
    id: 'emergency-life-support',
    title: 'Emergency & Life Support',
    equipment: [
      { name: 'Defibrillators / AEDs', description: 'Restore normal heart rhythms during cardiac arrest.' },
      { name: 'Ventilators & Anesthesia Machines', description: 'Provide mechanical respiratory support and gas delivery.' },
      { name: 'Emergency Crash Cart', description: 'Mobile unit packed with resuscitation and airway tools.' },
      { name: 'Oxygen Cylinders & Concentrators', description: 'Supply continuous medical oxygen.' },
      { name: 'Suction Units', description: 'Clear blood, mucus, and airway obstructions.' },
    ],
  },
  {
    id: 'icu-ward-monitoring',
    title: 'Intensive Care Unit (ICU) & Ward Monitoring',
    equipment: [
      { name: 'Patient Vital Sign Monitors', description: 'Track heart rate, blood pressure, temperature, and SpO₂ continuously.' },
      { name: 'Infusion & Syringe Pumps', description: 'Regulate precise, continuous delivery of intravenous medications.' },
      { name: 'ECG Machines', description: 'Record electrical activity of the heart for cardiac diagnoses.' },
      { name: 'Hospital Beds & Stretchers', description: 'Adjustable platforms for patient care and safe intra-facility transport.' },
    ],
  },
  {
    id: 'operation-theatre-surgery',
    title: 'Operation Theatre (OT) & Surgery',
    equipment: [
      { name: 'OT Lights & Surgical Tables', description: 'Provide shadow-free illumination and multi-position patient control.' },
      { name: 'Electrosurgical Units (ESU)', description: 'Cut tissue and coagulate blood during operations.' },
      { name: 'Endoscopic Imaging Systems', description: 'Offer high-definition visual feedback for minimally invasive procedures.' },
      { name: 'Sterilization Equipment (Autoclaves)', description: 'Ensure complete decontamination of surgical instruments.' },
    ],
  },
  {
    id: 'diagnostic-imaging',
    title: 'Diagnostic & Imaging',
    equipment: [
      { name: 'X-Ray & Ultrasound Machines', description: 'Deliver real-time or structural skeletal and soft-tissue imaging.' },
      { name: 'CT Scanners & MRI Machines', description: 'Provide cross-sectional and high-resolution internal organ visualization.' },
      { name: 'Laboratory Analyzers', description: 'Process blood, biochemistry, and pathology samples (e.g., cell counters, centrifuges).' },
    ],
  },
];

function timeAsMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function equipmentTimesOverlap(start: string, duration: number, booking: EquipmentBooking) {
  const requestedStart = timeAsMinutes(start);
  const bookedStart = timeAsMinutes(booking.time);
  return requestedStart < bookedStart + booking.hours * 60 && bookedStart < requestedStart + duration * 60;
}

function EquipmentWorkspace() {
  const [bookings, setBookings] = usePersistentState<EquipmentBooking[]>('hospital-flow-equipment-bookings-v1', () => [
    { id: 'equipment-seed-1', equipmentId: 'ecg', date: todayDate(), time: '10:00', hours: 2, department: 'Outpatient clinic' },
    { id: 'equipment-seed-2', equipmentId: 'monitor', date: todayDate(), time: '12:00', hours: 1, department: 'Emergency department' },
  ]);
  const [equipmentId, setEquipmentId] = useState('ultrasound');
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState('10:00');
  const [hours, setHours] = useState(1);
  const [department, setDepartment] = useState('Imaging');
  const [notice, setNotice] = useState<{ tone: string; text: string } | null>(null);
  const selectedEquipment = equipment.find((item) => item.id === equipmentId) ?? equipment[0];
  const isOutageActive = Boolean(selectedEquipment.maintenance) && date === todayDate();
  const conflictingBooking = bookings.find((booking) => booking.equipmentId === equipmentId && booking.date === date && equipmentTimesOverlap(time, hours, booking));

  function bookEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isOutageActive) {
      setNotice({ tone: 'warning', text: `${selectedEquipment.name} is marked unavailable. ${selectedEquipment.maintenance}.` });
      return;
    }
    if (conflictingBooking) {
      setNotice({ tone: 'warning', text: `${selectedEquipment.name} is booked from ${conflictingBooking.time} for ${conflictingBooking.hours} hour(s). Choose a non-overlapping time.` });
      return;
    }
    setBookings((current) => [{ id: `equipment-${Date.now()}`, equipmentId, date, time, hours, department: department.trim() || 'Unassigned department' }, ...current]);
    setNotice({ tone: 'success', text: `${selectedEquipment.name} booked for ${date} at ${time}.` });
  }

  return (
    <section className="scenario-workspace">
      <PageHeading eyebrow="SHARED RESOURCES" title="Equipment booking" description="Book shared clinical equipment, check utilization, and keep maintenance outages visible." icon={Wrench} />
      <div className="scenario-metrics">
        <Metric label="Equipment items" value={String(equipment.length)} note="Across shared pools" tone="blue" />
        <Metric label="In maintenance" value={String(equipment.filter((item) => item.maintenance).length)} note="Unavailable to book" tone="coral" />
        <Metric label="Bookings today" value={String(bookings.filter((item) => item.date === todayDate()).length)} note="All departments" tone="mint" />
      </div>
      {equipmentCategories.map((category) => (
        <section className="workflow-panel full-panel" key={category.id} aria-labelledby={`equipment-category-${category.id}`}>
          <div className="panel-heading">
            <div><p className="panel-kicker">CLINICAL EQUIPMENT</p><h3 id={`equipment-category-${category.id}`}>{category.title}</h3></div>
            <span className="panel-count">{category.equipment.length} equipment types</span>
          </div>
          <ul className="life-support-grid">
            {category.equipment.map((item) => (
              <li className="life-support-item" key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="workflow-columns">
        <section className="workflow-panel booking-panel">
          <div className="panel-heading"><div><p className="panel-kicker">NEW BOOKING</p><h3>Book equipment</h3></div><span className="step-mark">01</span></div>
          <form className="workflow-form" onSubmit={bookEquipment}>
            <label>Equipment<select value={equipmentId} onChange={(event) => { setEquipmentId(event.target.value); setNotice(null); }}>{equipment.map((item) => <option key={item.id} value={item.id}>{item.name}{item.maintenance && date === todayDate() ? ' · unavailable today' : ''}</option>)}</select></label>
            <div className="equipment-location"><Hospital size={15} /> {selectedEquipment.location}</div>
            {isOutageActive && <div className="inline-alert alert-warning" role="status"><Wrench size={18} /><span>{selectedEquipment.maintenance}. Booking is blocked for today.</span></div>}
            <div className="form-pair">
              <label>Date<input type="date" value={date} min={todayDate()} onChange={(event) => setDate(event.target.value)} required /></label>
              <label>Start time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
            </div>
            <div className="form-pair">
              <label>Duration<select value={hours} onChange={(event) => setHours(Number(event.target.value))}><option value={1}>1 hour</option><option value={2}>2 hours</option><option value={4}>4 hours</option><option value={8}>Full shift · 8 hours</option></select></label>
              <label>Department<input value={department} onChange={(event) => setDepartment(event.target.value)} maxLength={60} /></label>
            </div>
            {notice && <div className={`inline-alert alert-${notice.tone}`} role="status">{notice.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span>{notice.text}</span></div>}
            <button className="btn btn-primary" type="submit" disabled={isOutageActive}><PackageCheck size={16} /> Book equipment</button>
          </form>
        </section>
        <section className="workflow-panel utilization-panel">
          <div className="panel-heading"><div><p className="panel-kicker">RESOURCE STATUS</p><h3>Availability & utilization</h3></div></div>
          <div className="equipment-list">
            {equipment.map((item) => {
              const hoursBooked = bookings.filter((booking) => booking.equipmentId === item.id && booking.date === todayDate()).reduce((total, booking) => total + booking.hours, 0);
              const outageActive = Boolean(item.maintenance) && date === todayDate();
              const utilization = outageActive ? 0 : Math.min(100, Math.round(hoursBooked / 8 * 100));
              return <div className="equipment-row" key={item.id}>
                <div className="equipment-row-top"><div><strong>{item.name}</strong><small>{item.location}</small></div><span className={`status-pill ${outageActive ? 'status-maintenance' : 'status-confirmed'}`}>{outageActive ? 'Unavailable' : 'Available'}</span></div>
                {outageActive ? <p className="equipment-outage"><Wrench size={14} /> {item.maintenance}</p> : <div className="utilization-line"><div className="utilization-track"><span style={{ width: `${utilization}%` }} /></div><small>{utilization}% utilization</small></div>}
              </div>;
            })}
          </div>
        </section>
      </div>
      <section className="workflow-panel full-panel">
        <div className="panel-heading"><div><p className="panel-kicker">SCHEDULE</p><h3>Today's equipment bookings</h3></div><span className="panel-count">{bookings.filter((item) => item.date === todayDate()).length} bookings</span></div>
        {bookings.filter((item) => item.date === todayDate()).length ? <div className="table-scroll"><table className="workflow-table"><thead><tr><th>Equipment</th><th>Time</th><th>Duration</th><th>Department</th></tr></thead><tbody>{bookings.filter((item) => item.date === todayDate()).sort((a, b) => a.time.localeCompare(b.time)).map((booking) => <tr key={booking.id}><td><strong>{equipment.find((item) => item.id === booking.equipmentId)?.name}</strong></td><td>{booking.time}</td><td>{booking.hours} {booking.hours === 1 ? 'hour' : 'hours'}</td><td>{booking.department}</td></tr>)}</tbody></table></div> : <EmptyState>No equipment bookings for today.</EmptyState>}
      </section>
    </section>
  );
}

const campCapacity = 120;

function CampWorkspace() {
  const [allocations, setAllocations] = usePersistentState<CampAllocation[]>('hospital-flow-camp-allocations-v1', () => [
    { id: 'camp-seed-1', resource: 'Care kits', units: 72, department: 'Community health team' },
  ]);
  const [resource, setResource] = useState('Care kits');
  const [units, setUnits] = useState(12);
  const [department, setDepartment] = useState('Community health team');
  const [notice, setNotice] = useState<{ tone: string; text: string } | null>(null);
  const allocated = allocations.reduce((total, allocation) => total + allocation.units, 0);
  const remaining = Math.max(0, campCapacity - allocated);

  function allocateResources(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (units > remaining) {
      setNotice({ tone: 'warning', text: `Only ${remaining} units remain. This allocation was blocked to protect camp capacity.` });
      return;
    }
    setAllocations((current) => [{ id: `camp-${Date.now()}`, resource, units, department: department.trim() || 'Unassigned team' }, ...current]);
    setNotice({ tone: 'success', text: `${units} ${resource.toLowerCase()} allocated. ${remaining - units} units remain.` });
  }

  return (
    <section className="scenario-workspace">
      <PageHeading eyebrow="COMMUNITY OUTREACH" title="Health camp" description="Allocate resource units to the camp while keeping the remaining capacity in view." icon={Stethoscope} />
      <section className="camp-capacity-panel">
        <div className="capacity-topline"><div><p className="panel-kicker">NORTHSIDE WELLNESS CAMP</p><h3>Resource capacity</h3></div><span className={`status-pill ${remaining === 0 ? 'status-maintenance' : 'status-confirmed'}`}>{remaining === 0 ? 'At capacity' : 'Open for allocation'}</span></div>
        <div className="capacity-numbers"><div><strong>{allocated}</strong><span>allocated</span></div><div className="capacity-divider">/</div><div><strong>{campCapacity}</strong><span>total units</span></div><div className="capacity-remaining"><strong>{remaining}</strong><span>remaining</span></div></div>
        <div className="capacity-track" role="progressbar" aria-label="Camp resource capacity" aria-valuemin={0} aria-valuemax={campCapacity} aria-valuenow={allocated}><span style={{ width: `${Math.min(100, allocated / campCapacity * 100)}%` }} /></div>
        <div className="capacity-caption"><span>0 units</span><span>{Math.round(allocated / campCapacity * 100)}% allocated</span><span>{campCapacity} units</span></div>
      </section>
      <div className="workflow-columns">
        <section className="workflow-panel booking-panel">
          <div className="panel-heading"><div><p className="panel-kicker">RESOURCE PLANNING</p><h3>Allocate units</h3></div><span className="step-mark">01</span></div>
          <form className="workflow-form" onSubmit={allocateResources}>
            <label>Resource type<select value={resource} onChange={(event) => setResource(event.target.value)}><option>Care kits</option><option>Screening kits</option><option>Staff shifts</option><option>Transport units</option></select></label>
            <div className="form-pair">
              <label>Number of units<input type="number" min={1} value={units} onChange={(event) => setUnits(Math.max(1, Number(event.target.value)))} required /></label>
              <label>Allocating team<input value={department} onChange={(event) => setDepartment(event.target.value)} maxLength={60} /></label>
            </div>
            <p className="form-hint">Up to {remaining} units can be allocated without exceeding capacity.</p>
            {notice && <div className={`inline-alert alert-${notice.tone}`} role={notice.tone === 'warning' ? 'alert' : 'status'}>{notice.tone === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span>{notice.text}</span></div>}
            <button className="btn btn-primary" type="submit" disabled={remaining === 0}><Plus size={16} /> Allocate resources</button>
          </form>
        </section>
        <section className="workflow-panel schedule-panel">
          <div className="panel-heading"><div><p className="panel-kicker">ALLOCATION LOG</p><h3>Resource units assigned</h3></div><span className="panel-count">{allocations.length} entries</span></div>
          {allocations.length ? <div className="allocation-list">{allocations.map((allocation) => <div className="allocation-row" key={allocation.id}><span className="allocation-icon"><PackageCheck size={17} /></span><div><strong>{allocation.resource}</strong><small>{allocation.department}</small></div><b>{allocation.units}<small> units</small></b></div>)}</div> : <EmptyState>No resources have been allocated yet.</EmptyState>}
        </section>
      </div>
      {remaining === 0 && <div className="inline-alert alert-warning capacity-alert" role="status"><AlertTriangle size={18} /><span>Camp is at capacity. Additional allocations are blocked until units are released.</span></div>}
    </section>
  );
}

export function ScenarioWorkspace({ route }: { route: ScenarioRoute }) {
  if (route === 'home') return <ScenarioHome />;
  if (route === 'labs') return <LabWorkspace />;
  if (route === 'equipment') return <EquipmentWorkspace />;
  if (route === 'occupancy') return <OccupancyWorkspace />;
  if (route === 'camps') return <CampWorkspace />;
  if (route === 'pharmacy') return <PharmacyWorkspace />;
  if (route === 'trauma') return <TraumaWorkspace />;
  if (route === 'clinicians') return <CliniciansWorkspace />;
  if (route === 'staff') return <StaffWorkspace />;
  if (route === 'alerts') return <AlertsWorkspace />;
  if (route === 'blood-bank') return <BloodBankWorkspace />;
  if (route === 'ambulance') return <AmbulanceWorkspace />;
  if (route === 'infection-control') return <InfectionControlWorkspace />;
  return null;
}
