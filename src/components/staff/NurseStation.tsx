import React, { useState } from 'react';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useHospitalFlow } from '../../context/HospitalFlowContext';
import { useOperations } from '../../context/OperationsContext';

interface NurseStationProps {
  onOpenCreateCase?: () => void;
}

export const NurseStation: React.FC<NurseStationProps> = () => {
  const { cases, toggleNursingHandoff, toggleBillingHandoff, confirmRoomDeparture } = useHospitalFlow();
  const { staff } = useOperations();

  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'pending' | 'completed' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeShiftNurse, setActiveShiftNurse] = useState('Sister Sunita Rao (Charge Nurse)');

  const wards = ['ALL', 'Ward 4B (Stepdown)', 'Ward 1 (Day Care)', 'ICU Ward 5A', 'Trauma Bay'];

  const onDutyNurses = staff.filter(
    (s) => (s.role === 'CHARGE_NURSE' || s.role === 'STAFF_NURSE' || s.role === 'ICU_SPECIALIST_NURSE') &&
           (s.status === 'AVAILABLE' || s.status === 'ASSIGNED')
  );

  const filteredCases = cases.filter((c) => {
    if (selectedWard !== 'ALL' && c.ward !== selectedWard) return false;
    if (filterMode === 'pending' && c.nursingComplete) return false;
    if (filterMode === 'completed' && !c.nursingComplete) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        c.caseRef.toLowerCase().includes(term) ||
        c.bed.toLowerCase().includes(term) ||
        c.room.toLowerCase().includes(term) ||
        c.ward.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  const pendingHandoffsCount = cases.filter((c) => !c.nursingComplete).length;
  const completedHandoffsCount = cases.filter((c) => c.nursingComplete).length;
  const readyForDepartureCount = cases.filter((c) => c.nursingComplete && !c.departureConfirmed).length;

  return (
    <div className="nurse-station-page">
      {/* Top Banner Notice: Clinical Scope & Privacy */}
      <div className="dashboard-subbar">
        <div className="subbar-left">
          <span className="live-pulse-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            NURSE TERMINAL ACTIVE
          </span>
          <span className="subbar-divider">•</span>
          <span className="subbar-text">
            Digital Handoff & Patient Transfer Authorization • Zero Clinical PII
          </span>
        </div>
        <div className="subbar-right">
          <UserCheck size={14} className="text-blue" />
          <span>Active Shift: {activeShiftNurse}</span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="dashboard-metrics-grid mb-4">
        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">Pending Clinical Handoffs</span>
            <div className="metric-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <HeartHandshake size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value text-blue">{pendingHandoffsCount}</strong>
            <span className="metric-subtext">Awaiting chart & med reconciliation</span>
          </div>
        </div>

        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">Ready for Room Departure</span>
            <div className="metric-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
              <ArrowRight size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value text-amber">{readyForDepartureCount}</strong>
            <span className="metric-subtext">Handoffs done; physical vacate pending</span>
          </div>
        </div>

        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">Completed Handoffs</span>
            <div className="metric-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value text-green">{completedHandoffsCount}</strong>
            <span className="metric-subtext">Authorized transfers this shift</span>
          </div>
        </div>

        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">On-Duty Nursing Roster</span>
            <div className="metric-icon-wrap" style={{ background: '#f8fafc', color: '#475569' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value">{onDutyNurses.length}</strong>
            <span className="metric-subtext">Active floor & ICU coverage</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Filter Toolbar + Handoff Cards Matrix */}
      <div className="ops-card">
        <div className="ops-card-header">
          <div>
            <h3>Inpatient Bed Transfer & Handoff Board</h3>
            <p className="section-desc">
              Execute standardized 3-step discharge transfers: clinical clearance, pharmacy reconciliation, and room exit.
            </p>
          </div>
          <div className="toolbar-tab-group">
            <button
              type="button"
              className={`toolbar-tab ${filterMode === 'pending' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('pending')}
            >
              Action Required ({pendingHandoffsCount})
            </button>
            <button
              type="button"
              className={`toolbar-tab ${filterMode === 'completed' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('completed')}
            >
              Completed ({completedHandoffsCount})
            </button>
            <button
              type="button"
              className={`toolbar-tab ${filterMode === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All Beds ({cases.length})
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="workspace-toolbar-card mb-4" style={{ background: '#f8fafc' }}>
          <div className="toolbar-left">
            <div className="search-input-wrap" style={{ maxWidth: '320px', width: '100%' }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search bed, room, case ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>

            <div className="toolbar-filter-box">
              <Filter size={15} className="text-slate" />
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="toolbar-select"
              >
                {wards.map((w) => (
                  <option key={w} value={w}>
                    {w === 'ALL' ? 'All Hospital Wards' : w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="toolbar-right">
            <select
              value={activeShiftNurse}
              onChange={(e) => setActiveShiftNurse(e.target.value)}
              className="toolbar-select"
              title="Sign handoffs as this staff member"
            >
              {onDutyNurses.map((nurse) => (
                <option key={nurse.id} value={`${nurse.name} (${nurse.assignedArea})`}>
                  Sign as: {nurse.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Handoff Cards Matrix */}
        <div className="nurse-handoff-grid">
          {filteredCases.length === 0 ? (
            <div className="empty-state-card" style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center' }}>
              <CheckCircle2 size={40} className="text-green mb-2" style={{ margin: '0 auto' }} />
              <h4>All nursing handoffs clear in this view</h4>
              <p className="text-muted">No pending transfer verifications matching current filters.</p>
            </div>
          ) : (
            filteredCases.map((c) => {
              const isReadyToDepart = c.nursingComplete && !c.departureConfirmed;
              const isFullyDeparted = c.departureConfirmed;

              return (
                <div
                  key={c.id}
                  className={`nurse-card ${!c.nursingComplete ? 'is-pending' : isReadyToDepart ? 'is-ready' : 'is-done'}`}
                >
                  <div className="nurse-card-header">
                    <div>
                      <span className="nurse-card-ref">{c.caseRef}</span>
                      <strong className="nurse-card-bed">{c.bed}</strong>
                      <span className="nurse-card-room">{c.ward} • {c.room}</span>
                    </div>
                    <StatusBadge
                      label={
                        isFullyDeparted
                          ? 'DEPARTED'
                          : isReadyToDepart
                          ? 'VACATE READY'
                          : 'HANDOFF PENDING'
                      }
                      tone={
                        isFullyDeparted
                          ? 'green'
                          : isReadyToDepart
                          ? 'amber'
                          : 'blue'
                      }
                      size="sm"
                    />
                  </div>

                  <div className="nurse-card-body">
                    <div className="handoff-check-row">
                      <label className="handoff-checkbox-label">
                        <input
                          type="checkbox"
                          checked={c.nursingComplete}
                          onChange={() => toggleNursingHandoff(c.id)}
                          disabled={c.departureConfirmed}
                        />
                        <div>
                          <strong>1. Clinical Nursing Transfer Complete</strong>
                          <span>Medications reconciled, discharge summary signed, vitals stable</span>
                        </div>
                      </label>
                      {c.nursingCompletedAt && (
                        <span className="handoff-timestamp">
                          ✓ Signed at {new Date(c.nursingCompletedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <div className="handoff-check-row">
                      <label className="handoff-checkbox-label">
                        <input
                          type="checkbox"
                          checked={c.billingComplete}
                          onChange={() => toggleBillingHandoff(c.id)}
                          disabled={c.departureConfirmed}
                        />
                        <div>
                          <strong>2. TPA & Pharmacy Clearance</strong>
                          <span>Discharge medication pack dispensed, financial ledger closed</span>
                        </div>
                      </label>
                    </div>

                    <div className="handoff-check-row departure-step">
                      <div className="departure-info">
                        <strong>3. Physical Patient Departure</strong>
                        <span>
                          {c.departureConfirmed
                            ? `✓ Patient departed at ${c.departureConfirmedAt ? new Date(c.departureConfirmedAt).toLocaleTimeString() : 'Recorded'}`
                            : 'Patient physically exits room; automatically alerts Housekeeping crew.'}
                        </span>
                      </div>
                      {!c.departureConfirmed ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={!c.nursingComplete}
                          onClick={() => confirmRoomDeparture(c.id)}
                        >
                          Confirm Departure →
                        </button>
                      ) : (
                        <span className="badge-pill tone-green">Departed</span>
                      )}
                    </div>
                  </div>

                  <div className="nurse-card-footer">
                    <div className="footer-meta">
                      <Clock size={12} />
                      <span>Turnaround Priority: <strong>{c.priority}</strong></span>
                    </div>
                    <span className="nurse-bed-type">{c.bedType}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
