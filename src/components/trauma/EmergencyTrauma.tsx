import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import type { TraumaBay } from '../../types';

export const EmergencyTrauma: React.FC = () => {
  const { traumaBays, updateTraumaBayStatus } = useOperations();

  // Verification & Blocker Modal State
  const [selectedBay, setSelectedBay] = useState<TraumaBay | null>(null);
  const [modalMode, setModalMode] = useState<'VERIFY' | 'BLOCK' | 'IN_USE'>('VERIFY');
  const [checklistDraft, setChecklistDraft] = useState<TraumaBay['checklist']>({
    crashCartChecked: true,
    defibrillatorCharged: true,
    ventilatorTested: true,
    suctionOperational: true,
    oxygenPipedOk: true,
    monitorsSanitized: true,
  });
  const [blockerNote, setBlockerNote] = useState('');
  const [assignedTeam, setAssignedTeam] = useState('Code Red Trauma Team Alpha');
  const [inspectorName, setInspectorName] = useState('Charge Nurse');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const readyCount = traumaBays.filter((b) => b.status === 'READY').length;
  const inUseCount = traumaBays.filter((b) => b.status === 'IN_USE').length;
  const blockedCount = traumaBays.filter((b) => b.status === 'BLOCKED' || b.status === 'MAINTENANCE').length;
  const awaitingCount = traumaBays.filter((b) => b.status === 'AWAITING_CONFIRMATION' || b.status === 'CLEANING_REQUIRED').length;

  const handleOpenVerifyModal = (bay: TraumaBay) => {
    setSelectedBay(bay);
    setModalMode('VERIFY');
    setChecklistDraft({ ...bay.checklist });
    setInspectorName('Charge Nurse');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleOpenBlockModal = (bay: TraumaBay) => {
    setSelectedBay(bay);
    setModalMode('BLOCK');
    setBlockerNote('Suction canister regulator leak identified');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleOpenInUseModal = (bay: TraumaBay) => {
    setSelectedBay(bay);
    setModalMode('IN_USE');
    setAssignedTeam('Code Red Trauma Team 1');
    setModalError(null);
    setModalSuccess(null);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBay) return;
    setModalError(null);
    setModalSuccess(null);

    if (modalMode === 'VERIFY') {
      const res = updateTraumaBayStatus(
        selectedBay.id,
        'READY',
        checklistDraft,
        undefined,
        inspectorName
      );
      if (!res.success) {
        setModalError(res.error || 'Failed to certify readiness.');
        return;
      }
      setModalSuccess(`${selectedBay.bayNumber} declared READY for acute resuscitation.`);
    } else if (modalMode === 'BLOCK') {
      updateTraumaBayStatus(
        selectedBay.id,
        'BLOCKED',
        undefined,
        blockerNote,
        inspectorName
      );
      setModalSuccess(`${selectedBay.bayNumber} status transitioned to BLOCKED.`);
    } else if (modalMode === 'IN_USE') {
      updateTraumaBayStatus(
        selectedBay.id,
        'IN_USE',
        undefined,
        undefined,
        inspectorName
      );
      setModalSuccess(`${selectedBay.bayNumber} marked IN USE by ${assignedTeam}.`);
    }

    setTimeout(() => {
      setSelectedBay(null);
      setModalSuccess(null);
    }, 1000);
  };

  return (
    <div className="trauma-workspace-page">
      {/* Top Banner Overview */}
      <div className="trauma-summary-banner">
        <div className="trauma-stat-box">
          <span className="trauma-stat-label">Total Resus Bays</span>
          <strong className="trauma-stat-val text-navy">{traumaBays.length} Bays</strong>
        </div>
        <div className="trauma-stat-divider" />
        <div className="trauma-stat-box">
          <span className="trauma-stat-label">Immediate Ready</span>
          <strong className="trauma-stat-val text-emerald">{readyCount} Available</strong>
        </div>
        <div className="trauma-stat-divider" />
        <div className="trauma-stat-box">
          <span className="trauma-stat-label">In Active Resuscitation</span>
          <strong className="trauma-stat-val text-blue">{inUseCount} In Use</strong>
        </div>
        <div className="trauma-stat-divider" />
        <div className="trauma-stat-box">
          <span className="trauma-stat-label">Verification / Cleaning</span>
          <strong className={`trauma-stat-val ${awaitingCount > 0 ? 'text-amber' : 'text-slate'}`}>
            {awaitingCount} Pending
          </strong>
        </div>
        <div className="trauma-stat-divider" />
        <div className="trauma-stat-box">
          <span className="trauma-stat-label">Blocked / Outage</span>
          <strong className={`trauma-stat-val ${blockedCount > 0 ? 'text-red' : 'text-slate'}`}>
            {blockedCount} Bays
          </strong>
        </div>
        <div className="trauma-stat-divider" />
        <div className="trauma-stat-box">
          <span className="trauma-stat-label">Protocol Safety</span>
          <span className="safety-guarantee-pill">
            <ShieldCheck size={13} /> Authorized Checklist Required
          </span>
        </div>
      </div>

      {/* Trauma Bays Grid */}
      <div className="trauma-bays-grid">
        {traumaBays.map((bay) => {
          const isReady = bay.status === 'READY';
          const isInUse = bay.status === 'IN_USE';
          const isBlocked = bay.status === 'BLOCKED' || bay.status === 'MAINTENANCE';
          const isPending = bay.status === 'AWAITING_CONFIRMATION' || bay.status === 'CLEANING_REQUIRED';

          return (
            <div key={bay.id} className={`trauma-bay-card status-${bay.status.toLowerCase()}`}>
              <div className="bay-card-top">
                <div className="bay-identity">
                  <div className="bay-icon-box">
                    <HeartPulse size={18} />
                  </div>
                  <div>
                    <h4 className="bay-name">{bay.bayNumber}</h4>
                    <span className="bay-type-tag">{bay.bayType.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <StatusBadge
                  label={bay.status.replace(/_/g, ' ')}
                  tone={
                    isReady
                      ? 'green'
                      : isInUse
                      ? 'blue'
                      : isPending
                      ? 'amber'
                      : 'red'
                  }
                />
              </div>

              {/* Status Note or Team */}
              <div className="bay-condition-box">
                {isInUse && (
                  <div className="bay-active-team">
                    <Activity size={14} className="text-blue" />
                    <span>Active Case: <strong>{bay.assignedTeam || 'Code Red Trauma Team'}</strong></span>
                  </div>
                )}
                {isBlocked && bay.blockerReason && (
                  <div className="bay-blocker-text">
                    <AlertTriangle size={14} className="text-red" />
                    <span>Blocker: {bay.blockerReason}</span>
                  </div>
                )}
                {isPending && (
                  <div className="bay-pending-text">
                    <Clock size={14} className="text-amber" />
                    <span>Inspection verification pending coordinator signoff</span>
                  </div>
                )}
                {isReady && (
                  <div className="bay-ready-text">
                    <CheckCircle2 size={14} className="text-emerald" />
                    <span>Resuscitation suite cleared & verified</span>
                  </div>
                )}
              </div>

              {/* Life-Support Equipment Checklist Badges */}
              <div className="bay-checklist-summary">
                <span className="checklist-subhead">Critical Suite Equipment:</span>
                <div className="checklist-mini-chips">
                  <span className={`chip ${bay.checklist.crashCartChecked ? 'chip-ok' : 'chip-fail'}`}>
                    Crash Cart {bay.checklist.crashCartChecked ? '✓' : '✗'}
                  </span>
                  <span className={`chip ${bay.checklist.defibrillatorCharged ? 'chip-ok' : 'chip-fail'}`}>
                    Defib {bay.checklist.defibrillatorCharged ? '✓' : '✗'}
                  </span>
                  <span className={`chip ${bay.checklist.ventilatorTested ? 'chip-ok' : 'chip-fail'}`}>
                    Ventilator {bay.checklist.ventilatorTested ? '✓' : '✗'}
                  </span>
                  <span className={`chip ${bay.checklist.oxygenPipedOk ? 'chip-ok' : 'chip-fail'}`}>
                    O2 Gas {bay.checklist.oxygenPipedOk ? '✓' : '✗'}
                  </span>
                  <span className={`chip ${bay.checklist.suctionOperational ? 'chip-ok' : 'chip-fail'}`}>
                    Suction {bay.checklist.suctionOperational ? '✓' : '✗'}
                  </span>
                </div>
              </div>

              <div className="bay-card-meta">
                <span>Inspector: <strong>{bay.lastInspector}</strong></span>
                <span>Updated: {bay.lastUpdated}</span>
              </div>

              {/* Action Buttons */}
              <div className="bay-card-actions">
                {isReady && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm flex-1"
                      onClick={() => handleOpenInUseModal(bay)}
                    >
                      <span>Mark In Use</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-red"
                      onClick={() => handleOpenBlockModal(bay)}
                      title="Report bay blocker"
                    >
                      Block
                    </button>
                  </>
                )}

                {isInUse && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => updateTraumaBayStatus(bay.id, 'CLEANING_REQUIRED')}
                  >
                    <span>Conclude & Clean</span>
                  </button>
                )}

                {(isBlocked || isPending) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => handleOpenVerifyModal(bay)}
                  >
                    <ShieldCheck size={14} />
                    <span>Verify Readiness</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Verification & Action Modal */}
      {selectedBay && (
        <div className="search-modal-backdrop" onClick={() => setSelectedBay(null)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <HeartPulse size={20} className="text-teal" />
                <h3>{selectedBay.bayNumber} — {modalMode === 'VERIFY' ? 'Verify Suite Readiness' : modalMode === 'BLOCK' ? 'Report Bay Outage' : 'Assign Trauma Intake'}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBay(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="modal-form">
              {modalMode === 'VERIFY' && (
                <>
                  <p className="form-hint">
                    Authorized Safety Gate: <strong>All resuscitation equipment checks must be confirmed</strong> before this bay can be marked READY for emergency admissions.
                  </p>

                  <div className="checklist-items-stack">
                    <label className="checklist-row">
                      <input
                        type="checkbox"
                        checked={checklistDraft.crashCartChecked}
                        onChange={(e) => setChecklistDraft((prev) => ({ ...prev, crashCartChecked: e.target.checked }))}
                      />
                      <div>
                        <strong>Crash Cart Intact & Sealed</strong>
                        <span>Emergency drugs and pediatric drawer verified with unbroken security seal</span>
                      </div>
                    </label>

                    <label className="checklist-row">
                      <input
                        type="checkbox"
                        checked={checklistDraft.defibrillatorCharged}
                        onChange={(e) => setChecklistDraft((prev) => ({ ...prev, defibrillatorCharged: e.target.checked }))}
                      />
                      <div>
                        <strong>Biphasic Defibrillator Battery & Pacer Pads</strong>
                        <span>Self-test passed; pacing and synchronized cardioversion electrodes docked</span>
                      </div>
                    </label>

                    <label className="checklist-row">
                      <input
                        type="checkbox"
                        checked={checklistDraft.ventilatorTested}
                        onChange={(e) => setChecklistDraft((prev) => ({ ...prev, ventilatorTested: e.target.checked }))}
                      />
                      <div>
                        <strong>Transport Ventilator Breathing Circuit</strong>
                        <span>Test lung compliance and circuit leak check calibrated</span>
                      </div>
                    </label>

                    <label className="checklist-row">
                      <input
                        type="checkbox"
                        checked={checklistDraft.oxygenPipedOk}
                        onChange={(e) => setChecklistDraft((prev) => ({ ...prev, oxygenPipedOk: e.target.checked }))}
                      />
                      <div>
                        <strong>Wall Oxygen & Compressed Air Pressure</strong>
                        <span>Pipeline pressure 55-60 PSI; auxiliary O2 cylinder full</span>
                      </div>
                    </label>

                    <label className="checklist-row">
                      <input
                        type="checkbox"
                        checked={checklistDraft.suctionOperational}
                        onChange={(e) => setChecklistDraft((prev) => ({ ...prev, suctionOperational: e.target.checked }))}
                      />
                      <div>
                        <strong>High-Vacuum Medical Suction</strong>
                        <span>Yankauer catheter connected and vacuum test &gt; 400 mmHg verified</span>
                      </div>
                    </label>

                    <label className="checklist-row">
                      <input
                        type="checkbox"
                        checked={checklistDraft.monitorsSanitized}
                        onChange={(e) => setChecklistDraft((prev) => ({ ...prev, monitorsSanitized: e.target.checked }))}
                      />
                      <div>
                        <strong>Multipara Monitor Sanitized & Calibrated</strong>
                        <span>ECG leads, SPO2 sensor, NIBP cuff and temperature probe ready</span>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {modalMode === 'BLOCK' && (
                <div className="form-group">
                  <label className="form-label">Blocker / Outage Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={blockerNote}
                    onChange={(e) => setBlockerNote(e.target.value)}
                    required
                    placeholder="Describe equipment malfunction or decontamination requirement..."
                  />
                </div>
              )}

              {modalMode === 'IN_USE' && (
                <div className="form-group">
                  <label className="form-label">Assigned Acute Care Team</label>
                  <input
                    type="text"
                    className="form-control"
                    value={assignedTeam}
                    onChange={(e) => setAssignedTeam(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Verifying Nurse / Coordinator Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  required
                />
              </div>

              {modalError && (
                <div className="inline-alert alert-error" role="alert">
                  <AlertTriangle size={18} />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="inline-alert alert-success" role="status">
                  <CheckCircle2 size={18} />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedBay(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${modalMode === 'BLOCK' ? 'btn-danger' : 'btn-primary'}`}
                >
                  Confirm {modalMode === 'VERIFY' ? 'Readiness Approval' : modalMode === 'BLOCK' ? 'Blocker Log' : 'Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
