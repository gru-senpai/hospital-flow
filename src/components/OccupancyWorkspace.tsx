import { useMemo } from 'react';
import { Activity, Bed, Check, ClipboardCheck, Clock3, Sparkles, Users } from 'lucide-react';
import { useFirebaseSession } from '../context/FirebaseSessionContext';
import { useFacilityData } from '../context/FacilityDataContext';
import './OccupancyWorkspace.css';

type BedStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Awaiting approval';
type CrewStatus = 'Available' | 'Assigned' | 'Off shift';

type OccupancyEvent = {
  id: string;
  bedId: string;
  at: string;
  actor: string;
  summary: string;
};

type OccupancyBed = {
  id: string;
  ward: string;
  room: string;
  bedType: string;
  status: BedStatus;
  assignedCrewId: string;
  cleaningStartedAt?: string;
};

type CleaningCrewMember = {
  id: string;
  name: string;
  shift: string;
  status: CrewStatus;
};

type OccupancyBoard = {
  beds: OccupancyBed[];
  crew: CleaningCrewMember[];
  events: OccupancyEvent[];
};

const initialBoard: OccupancyBoard = {
  beds: [
    { id: 'B-401', ward: 'Ward 4B', room: '402', bedType: 'Stepdown', status: 'Awaiting approval', assignedCrewId: 'HC-01', cleaningStartedAt: new Date(Date.now() - 18 * 60_000).toISOString() },
    { id: 'B-402', ward: 'Ward 4B', room: '402', bedType: 'Standard', status: 'Cleaning', assignedCrewId: 'HC-02', cleaningStartedAt: new Date(Date.now() - 11 * 60_000).toISOString() },
    { id: 'B-403', ward: 'Ward 4B', room: '403', bedType: 'Standard', status: 'Occupied', assignedCrewId: '' },
    { id: 'B-404', ward: 'Ward 4B', room: '404', bedType: 'Isolation', status: 'Available', assignedCrewId: '' },
    { id: 'B-501', ward: 'Ward 5A', room: '501', bedType: 'ICU stepdown', status: 'Occupied', assignedCrewId: '' },
    { id: 'B-502', ward: 'Ward 5A', room: '502', bedType: 'Standard', status: 'Available', assignedCrewId: '' },
    { id: 'B-503', ward: 'Ward 5A', room: '503', bedType: 'Standard', status: 'Cleaning', assignedCrewId: 'HC-03', cleaningStartedAt: new Date(Date.now() - 5 * 60_000).toISOString() },
    { id: 'B-504', ward: 'Ward 5A', room: '504', bedType: 'Standard', status: 'Available', assignedCrewId: '' },
  ],
  crew: [
    { id: 'HC-01', name: 'Crew 01', shift: '07:00–15:00', status: 'Assigned' },
    { id: 'HC-02', name: 'Crew 02', shift: '07:00–15:00', status: 'Assigned' },
    { id: 'HC-03', name: 'Crew 03', shift: '15:00–23:00', status: 'Assigned' },
    { id: 'HC-04', name: 'Crew 04', shift: '15:00–23:00', status: 'Available' },
  ],
  events: [
    { id: 'evt-seed-1', bedId: 'B-401', at: new Date(Date.now() - 18 * 60_000).toISOString(), actor: 'Housekeeping', summary: 'Cleaning finished; queued for readiness review.' },
    { id: 'evt-seed-2', bedId: 'B-402', at: new Date(Date.now() - 11 * 60_000).toISOString(), actor: 'Housekeeping', summary: 'Cleaning started by Crew 02.' },
    { id: 'evt-seed-3', bedId: 'B-503', at: new Date(Date.now() - 5 * 60_000).toISOString(), actor: 'Housekeeping', summary: 'Cleaning started by Crew 03.' },
  ],
};

function eventFor(bed: OccupancyBed, actor: string, summary: string): OccupancyEvent {
  return { id: `occ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, bedId: bed.id, at: new Date().toISOString(), actor, summary };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function OccupancyWorkspace() {
  const { profile } = useFirebaseSession();
  const [board, setBoard] = useFacilityData<OccupancyBoard>('bed-occupancy-board-v1', () => initialBoard);
  const canOperate = !!profile && ['admin', 'coordinator', 'operations', 'resource_manager', 'housekeeping'].includes(profile.role);
  const canReview = !!profile && ['admin', 'coordinator'].includes(profile.role);
  const available = board.beds.filter((bed) => bed.status === 'Available').length;
  const occupied = board.beds.filter((bed) => bed.status === 'Occupied').length;
  const cleaning = board.beds.filter((bed) => bed.status === 'Cleaning').length;
  const awaitingApproval = board.beds.filter((bed) => bed.status === 'Awaiting approval').length;
  const events = useMemo(() => [...board.events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10), [board.events]);

  function updateBed(bedId: string, status: BedStatus, summary: string) {
    const actor = profile?.role.replace('_', ' ') ?? 'Staff';
    setBoard((current) => {
      const bed = current.beds.find((item) => item.id === bedId);
      if (!bed) return current;
      const updated = { ...bed, status };
      if (status === 'Cleaning') updated.cleaningStartedAt = new Date().toISOString();
      if (status === 'Available' || status === 'Occupied') {
        updated.assignedCrewId = '';
        updated.cleaningStartedAt = undefined;
      }
      const event = eventFor(updated, actor, summary);
      const activeAssignments = current.beds.filter((item) => item.id !== bedId && item.status === 'Cleaning').map((item) => item.assignedCrewId);
      return {
        ...current,
        beds: current.beds.map((item) => item.id === bedId ? updated : item),
        crew: current.crew.map((member) => ({
          ...member,
          status: member.status === 'Off shift' ? 'Off shift' : activeAssignments.includes(member.id) || (status === 'Cleaning' && updated.assignedCrewId === member.id) ? 'Assigned' : 'Available',
        })),
        events: [event, ...current.events].slice(0, 200),
      };
    });
  }

  function assignCrew(bedId: string, crewId: string) {
    const member = board.crew.find((item) => item.id === crewId);
    if (!member || member.status === 'Off shift') return;
    setBoard((current) => {
      const bed = current.beds.find((item) => item.id === bedId);
      if (!bed || bed.status !== 'Cleaning') return current;
      const updated = { ...bed, assignedCrewId: crewId };
      const event = eventFor(updated, profile?.role.replace('_', ' ') ?? 'Staff', `Cleaning assigned to ${member.name}.`);
      const activeAssignments = current.beds.filter((item) => item.id !== bedId && item.status === 'Cleaning').map((item) => item.assignedCrewId);
      activeAssignments.push(crewId);
      return {
        ...current,
        beds: current.beds.map((item) => item.id === bedId ? updated : item),
        crew: current.crew.map((crewMember) => ({
          ...crewMember,
          status: crewMember.status === 'Off shift' ? 'Off shift' : activeAssignments.includes(crewMember.id) ? 'Assigned' : 'Available',
        })),
        events: [event, ...current.events].slice(0, 200),
      };
    });
  }

  return (
    <section className="occupancy-workspace">
      <div className="occupancy-heading">
        <div className="occupancy-title">
          <span className="occupancy-icon"><Bed size={21} /></span>
          <div>
            <p className="scenario-eyebrow">BED CAPACITY & HOUSEKEEPING</p>
            <h2>Bed occupancy and cleaning crew</h2>
            <p className="scenario-description">Coordinate bed availability, cleaning assignments, readiness review, and shift workload.</p>
          </div>
        </div>
        <span className="occupancy-facility">{profile?.facilityName}</span>
      </div>

      <div className="occupancy-metrics">
        <article><span>Available now</span><strong>{available}</strong><small>Ready for allocation</small></article>
        <article><span>Occupied</span><strong>{occupied}</strong><small>Currently in use</small></article>
        <article><span>Being cleaned</span><strong>{cleaning}</strong><small>Housekeeping active</small></article>
        <article><span>Awaiting review</span><strong>{awaitingApproval}</strong><small>Coordinator action</small></article>
      </div>

      <div className="occupancy-layout">
        <section className="workflow-panel occupancy-bed-panel">
          <div className="panel-heading"><div><p className="panel-kicker">LIVE CAPACITY</p><h3>Ward bed board</h3></div><span className="panel-count">{board.beds.length} beds</span></div>
          <div className="occupancy-bed-grid">
            {board.beds.map((bed) => {
              const assignedCrew = board.crew.find((member) => member.id === bed.assignedCrewId);
              return (
                <article className={`occupancy-bed-card bed-state-${bed.status.toLowerCase().replaceAll(' ', '-')}`} key={bed.id}>
                  <div className="occupancy-bed-card-top">
                    <span className="occupancy-bed-id"><Bed size={17} />{bed.id}</span>
                    <span className={`status-pill status-${bed.status === 'Available' ? 'confirmed' : bed.status === 'Cleaning' ? 'maintenance' : bed.status === 'Awaiting approval' ? 'warning' : 'neutral'}`}>{bed.status}</span>
                  </div>
                  <h4>{bed.ward} · Room {bed.room}</h4>
                  <p>{bed.bedType}</p>
                  {bed.status === 'Cleaning' && (
                    <div className="occupancy-assignment">
                      <label>Cleaning crew
                        <select aria-label={`Cleaning crew for ${bed.id}`} value={bed.assignedCrewId} onChange={(event) => assignCrew(bed.id, event.target.value)} disabled={!canOperate}>
                          <option value="">Assign crew…</option>
                          {board.crew.map((member) => <option key={member.id} value={member.id} disabled={member.status === 'Off shift' || (member.status === 'Assigned' && member.id !== bed.assignedCrewId)}>{member.name} · {member.status === 'Off shift' ? 'off shift' : member.status === 'Assigned' && member.id !== bed.assignedCrewId ? 'assigned' : member.shift}</option>)}
                        </select>
                      </label>
                      {bed.cleaningStartedAt && <small><Clock3 size={13} /> Started {formatTime(bed.cleaningStartedAt)}{assignedCrew ? ` · ${assignedCrew.name}` : ''}</small>}
                    </div>
                  )}
                  <div className="occupancy-bed-actions">
                    {bed.status === 'Occupied' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateBed(bed.id, 'Cleaning', 'Bed released for housekeeping cleaning.')} disabled={!canOperate}><Sparkles size={14} /> Send to cleaning</button>}
                    {bed.status === 'Cleaning' && <button type="button" className="btn btn-primary btn-sm" onClick={() => updateBed(bed.id, 'Awaiting approval', 'Cleaning completed; bed queued for readiness review.')} disabled={!canOperate || !bed.assignedCrewId}><Check size={14} /> Finish cleaning</button>}
                    {bed.status === 'Awaiting approval' && <>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => updateBed(bed.id, 'Available', 'Bed readiness approved and marked available.')} disabled={!canReview}><ClipboardCheck size={14} /> Approve ready</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateBed(bed.id, 'Cleaning', 'Readiness review requested additional cleaning.')} disabled={!canReview}>Re-clean</button>
                    </>}
                    {bed.status === 'Available' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateBed(bed.id, 'Occupied', 'Bed marked occupied for operational capacity tracking.')} disabled={!canOperate}><Bed size={14} /> Mark occupied</button>}
                  </div>
                </article>
              );
            })}
          </div>
          {!canOperate && <p className="panel-footnote">Your facility role is read-only for bed and housekeeping updates.</p>}
        </section>

        <aside className="occupancy-side-panel">
          <section className="workflow-panel">
            <div className="panel-heading"><div><p className="panel-kicker">SHIFT WORKLOAD</p><h3>Cleaning crew</h3></div><Users size={18} /></div>
            <div className="occupancy-crew-list">
              {board.crew.map((member) => {
                const task = board.beds.find((bed) => bed.status === 'Cleaning' && bed.assignedCrewId === member.id);
                return <article className="occupancy-crew-row" key={member.id}>
                  <span className={`crew-avatar ${member.status === 'Available' ? 'crew-available' : member.status === 'Off shift' ? 'crew-off' : ''}`}><Users size={17} /></span>
                  <div><strong>{member.name}</strong><small>{member.shift}{task ? ` · ${task.id}` : ''}</small></div>
                  <span className={`crew-status ${member.status.toLowerCase()}`}>{member.status}</span>
                </article>;
              })}
            </div>
            <p className="panel-footnote">Crew names and assignments are synthetic operational placeholders.</p>
          </section>

          <section className="workflow-panel occupancy-activity">
            <div className="panel-heading"><div><p className="panel-kicker">AUDIT ACTIVITY</p><h3>Recent updates</h3></div><Activity size={18} /></div>
            {events.length ? <ol className="occupancy-event-list">{events.map((event) => <li key={event.id}>
              <span className="event-dot" />
              <div><strong>{event.bedId} · {event.summary}</strong><small>{event.actor} · {formatTime(event.at)}</small></div>
            </li>)}</ol> : <p className="scenario-empty">No bed activity yet.</p>}
          </section>
        </aside>
      </div>
    </section>
  );
}
