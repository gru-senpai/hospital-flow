import React from 'react';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';

const stamp = (value?: string) =>
  value ? new Date(value).toLocaleString() : 'Not recorded';

export const NursePanel: React.FC = () => {
  const { labs, labReservations, equipment, doctors, alerts, lastSyncTime } =
    useOperations();
  const { cases } = useHospitalFlow();
  const blockers = equipment.filter(
    (item) =>
      item.status === 'OUT_OF_SERVICE' || item.status === 'MAINTENANCE_DUE',
  );
  const activeAlerts = alerts.filter((alert) => alert.status !== 'RESOLVED');

  return (
    <div className="role-workspace">
      <div className="role-intro">
        <div>
          <span className="role-kicker">NURSING OPERATIONS</span>
          <h2>Shift overview</h2>
          <p>Bed readiness, lab slots, equipment blockers and doctor coverage.</p>
        </div>
        <span className="demo-source-pill">
          Local demo records - refreshed {lastSyncTime.toLocaleTimeString()}
        </span>
      </div>

      <div className="role-metrics">
        <article>
          <span>Beds in turnaround</span>
          <strong>{cases.filter((item) => item.status !== 'BED_READY').length}</strong>
          <small>Shared bed cases</small>
        </article>
        <article>
          <span>Ready beds</span>
          <strong>{cases.filter((item) => item.status === 'BED_READY').length}</strong>
          <small>Coordinator approved</small>
        </article>
        <article>
          <span>Equipment blockers</span>
          <strong>{blockers.length}</strong>
          <small>Maintenance / out of service</small>
        </article>
        <article>
          <span>Active alerts</span>
          <strong>{activeAlerts.length}</strong>
          <small>Unresolved</small>
        </article>
      </div>

      <div className="role-columns">
        <section className="role-card">
          <header>
            <div>
              <h3>Bed readiness</h3>
              <p>Turnaround records only; no live hospital census or occupancy feed is connected.</p>
            </div>
          </header>
          {cases.map((item) => (
            <div className="role-row" key={item.id}>
              <div>
                <strong>{item.ward} / {item.bed}</strong>
                <small>{item.caseRef} - Source: bed turnaround workflow</small>
              </div>
              <div className="role-row-end">
                <b className="role-status">{item.status.replaceAll('_', ' ')}</b>
                <small>{stamp(item.approvedAt || item.departureConfirmedAt || item.createdAt)}</small>
              </div>
            </div>
          ))}
          {!cases.length && <p className="role-empty">No bed records yet.</p>}
        </section>

        <section className="role-card">
          <header>
            <div>
              <h3>Lab instruments and slots</h3>
              <p>Current status and a listed reservation from shared records.</p>
            </div>
          </header>
          {labs.map((lab) => {
            const reservation = labReservations.find(
              (item) => item.instrumentId === lab.id && item.status !== 'CANCELLED',
            );
            return (
              <div className="role-row" key={lab.id}>
                <div>
                  <strong>{lab.name}</strong>
                  <small>{lab.department} - {lab.labRoom} - Source: lab record</small>
                </div>
                <div className="role-row-end">
                  <b className="role-status">{lab.status.replaceAll('_', ' ')}</b>
                  <small>
                    {reservation
                      ? reservation.date + ' - ' + reservation.startTime + ' to ' + reservation.endTime
                      : 'Calibrated ' + stamp(lab.lastCalibratedAt)}
                  </small>
                </div>
              </div>
            );
          })}
          {!labs.length && <p className="role-empty">No lab instruments are listed.</p>}
        </section>

        <section className="role-card">
          <header>
            <div>
              <h3>Equipment watch</h3>
              <p>Maintenance blockers and telemetry from equipment records.</p>
            </div>
          </header>
          {equipment.map((item) => (
            <div className="role-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <small>{item.currentWard} - Source: equipment record</small>
              </div>
              <div className="role-row-end">
                <b className="role-status">{item.status.replaceAll('_', ' ')}</b>
                <small>{item.blockerReason || stamp(item.lastTelemetryTimestamp)}</small>
              </div>
            </div>
          ))}
          {!equipment.length && <p className="role-empty">No equipment is listed.</p>}
        </section>

        <section className="role-card">
          <header>
            <div>
              <h3>Doctor schedules</h3>
              <p>Department and shift coverage from existing roster records.</p>
            </div>
          </header>
          {doctors.map((doctor) => (
            <div className="role-row" key={doctor.id}>
              <div>
                <strong>{doctor.department} - {doctor.specialty}</strong>
                <small>{doctor.shift} - {doctor.shiftHours}</small>
              </div>
              <div className="role-row-end">
                <b className="role-status">{doctor.status.replaceAll('_', ' ')}</b>
                <small>{doctor.date} - {doctor.locationRoom}</small>
              </div>
            </div>
          ))}
          {!doctors.length && <p className="role-empty">No schedule records are listed.</p>}
        </section>
      </div>

      <section className="role-card">
        <header>
          <div>
            <h3>Operational alerts</h3>
            <p>Unresolved alerts from shared operational records.</p>
          </div>
        </header>
        {activeAlerts.map((alert) => (
          <div className="role-row" key={alert.id}>
            <div>
              <strong>{alert.title}</strong>
              <small>{alert.department} - {alert.summary}</small>
            </div>
            <div className="role-row-end">
              <b className="role-status">{alert.severity}</b>
              <small>{stamp(alert.timestamp)}</small>
            </div>
          </div>
        ))}
        {!activeAlerts.length && <p className="role-empty">No unresolved alerts.</p>}
      </section>

      <p className="role-boundary">
        Prototype records are stored in this browser only; they are not shared
        between users or devices.
      </p>
    </div>
  );
};
