import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Play,
  RotateCcw,
  Search,
  Filter,
  CheckSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useHospitalFlow } from '../../context/HospitalFlowContext';
import { useOperations } from '../../context/OperationsContext';

interface HousekeepingPortalProps {
  onOpenCreateCase?: () => void;
}

export const HousekeepingPortal: React.FC<HousekeepingPortalProps> = () => {
  const { cases, startCleaning, runAiCameraInspection, isProcessing } = useHospitalFlow();
  const { staff } = useOperations();

  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [filterTab, setFilterTab] = useState<'actionable' | 'all'>('actionable');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCleaner, setActiveCleaner] = useState('Supervisor Farooq (Housekeeping Lead)');

  const [activeChecklistCaseId, setActiveChecklistCaseId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    linensBagged: false,
    frameDisinfected: false,
    railsSanitized: false,
    wasteDisposed: false,
    o2Tested: false,
    floorMopped: false,
  });

  const wards = ['ALL', 'Ward 4B (Stepdown)', 'Ward 1 (Day Care)', 'ICU Ward 5A', 'Trauma Bay'];

  const housekeepingStaff = staff.filter(
    (s) => s.department === 'Facility Operations' || s.role === 'HOUSEKEEPING_SUPERVISOR' || s.role === 'NURSING_ORDERLY'
  );

  const cleaningCases = cases.filter((c) => {
    if (selectedWard !== 'ALL' && c.ward !== selectedWard) return false;
    if (filterTab === 'actionable') {
      // Show beds that need cleaning, are in progress, or flagged by AI for reclean
      const isActionable =
        c.status === 'CLEANING_IN_PROGRESS' ||
        c.status === 'REJECTED_RECLEAN' ||
        (c.departureConfirmed && c.status === 'HANDOFFS_PENDING') ||
        c.status === 'AWAITING_REVIEW';
      if (!isActionable) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match =
        c.caseRef.toLowerCase().includes(term) ||
        c.bed.toLowerCase().includes(term) ||
        c.room.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  const inProgressCount = cases.filter((c) => c.status === 'CLEANING_IN_PROGRESS').length;
  const recleanAnomalyCount = cases.filter((c) => c.status === 'REJECTED_RECLEAN').length;
  const readyForScanCount = cases.filter((c) => c.status === 'AWAITING_REVIEW').length;
  const bedReadyCount = cases.filter((c) => c.status === 'BED_READY').length;

  const handleOpenChecklistModal = (caseId: string) => {
    setActiveChecklistCaseId(caseId);
    setChecklist({
      linensBagged: true,
      frameDisinfected: true,
      railsSanitized: true,
      wasteDisposed: true,
      o2Tested: true,
      floorMopped: true,
    });
  };

  const handleCompleteCleaningWithScan = async (caseId: string) => {
    setActiveChecklistCaseId(null);
    await runAiCameraInspection(caseId, false);
  };

  return (
    <div className="housekeeping-portal-page">
      {/* Top Banner Notice: Environmental Safety */}
      <div className="dashboard-subbar">
        <div className="subbar-left">
          <span className="live-pulse-badge" style={{ background: '#ccfbf1', color: '#0f766e' }}>
            HOUSEKEEPING DISINFECTION TERMINAL
          </span>
          <span className="subbar-divider">•</span>
          <span className="subbar-text">
            7-Step Terminal Sanitation Protocol • Autonomous Overhead AI Camera Verification
          </span>
        </div>
        <div className="subbar-right">
          <ShieldCheck size={14} className="text-teal" />
          <span>Active Crew: {activeCleaner}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-metrics-grid mb-4">
        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">Sanitisation In Progress</span>
            <div className="metric-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Sparkles size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value text-blue">{inProgressCount}</strong>
            <span className="metric-subtext">Active mop & spray protocols</span>
          </div>
        </div>

        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">AI Camera Verification Queue</span>
            <div className="metric-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Camera size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value text-amber">{readyForScanCount}</strong>
            <span className="metric-subtext">Overhead vision sweep in progress</span>
          </div>
        </div>

        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">AI Reclean Alerts</span>
            <div className="metric-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value text-red">{recleanAnomalyCount}</strong>
            <span className="metric-subtext">Vision detected residue or unmade linen</span>
          </div>
        </div>

        <div className="ops-card metric-compact-card">
          <div className="metric-header">
            <span className="metric-label">Turnover Complete (Bed Ready)</span>
            <div className="metric-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="metric-value-row">
            <strong className="metric-value text-green">{bedReadyCount}</strong>
            <span className="metric-subtext">AI confirmed & ready for admission</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="ops-card">
        <div className="ops-card-header">
          <div>
            <h3>Housekeeping Room Turnover Board</h3>
            <p className="section-desc">
              Manage terminal cleaning tasks. Once sanitized, trigger the autonomous AI Camera Scan to verify cleanliness with zero human approval lag.
            </p>
          </div>
          <div className="toolbar-tab-group">
            <button
              type="button"
              className={`toolbar-tab ${filterTab === 'actionable' ? 'is-active' : ''}`}
              onClick={() => setFilterTab('actionable')}
            >
              Actionable Beds ({cleaningCases.length})
            </button>
            <button
              type="button"
              className={`toolbar-tab ${filterTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilterTab('all')}
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
              value={activeCleaner}
              onChange={(e) => setActiveCleaner(e.target.value)}
              className="toolbar-select"
            >
              {housekeepingStaff.map((cleaner) => (
                <option key={cleaner.id} value={`${cleaner.name} (${cleaner.assignedArea})`}>
                  Logged in: {cleaner.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cleaning Grid */}
        <div className="housekeeping-grid">
          {cleaningCases.length === 0 ? (
            <div className="empty-state-card" style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center' }}>
              <CheckCircle2 size={40} className="text-green mb-2" style={{ margin: '0 auto' }} />
              <h4>All rooms in this view sanitized</h4>
              <p className="text-muted">No pending housekeeping or reclean alerts matching current filters.</p>
            </div>
          ) : (
            cleaningCases.map((c) => {
              const needsCleaningStart = c.departureConfirmed && !c.cleaningStarted;
              const isSanitizing = c.status === 'CLEANING_IN_PROGRESS';
              const isAnomaly = c.status === 'REJECTED_RECLEAN';
              const isReady = c.status === 'BED_READY';

              return (
                <div
                  key={c.id}
                  className={`housekeeping-card ${
                    isAnomaly ? 'is-anomaly' : isSanitizing ? 'is-cleaning' : isReady ? 'is-ready' : ''
                  }`}
                >
                  <div className="housekeeping-card-header">
                    <div>
                      <span className="housekeeping-ref">{c.caseRef}</span>
                      <strong className="housekeeping-bed">{c.bed}</strong>
                      <span className="housekeeping-room">{c.ward} • {c.room}</span>
                    </div>
                    <StatusBadge
                      label={
                        isReady
                          ? 'AI READY'
                          : isAnomaly
                          ? 'AI RE-CLEAN'
                          : isSanitizing
                          ? 'SANITIZING'
                          : c.status.replace(/_/g, ' ')
                      }
                      tone={
                        isReady
                          ? 'green'
                          : isAnomaly
                          ? 'red'
                          : isSanitizing
                          ? 'blue'
                          : 'slate'
                      }
                      size="sm"
                    />
                  </div>

                  <div className="housekeeping-card-body">
                    {isAnomaly && (
                      <div className="anomaly-warning-box">
                        <AlertTriangle size={16} className="text-red" />
                        <div>
                          <strong>AI Vision Anomaly Detected:</strong>
                          <p>{c.aiInspection?.aiDecisionSummary || 'Surface stains or linen wrinkles detected by camera.'}</p>
                        </div>
                      </div>
                    )}

                    <div className="cleaning-protocol-checklist">
                      <div className="protocol-item checked">
                        <CheckSquare size={14} className="text-teal" />
                        <span>High-Touch Quat Spray (Beds, Rails, IV Stands)</span>
                      </div>
                      <div className="protocol-item checked">
                        <CheckSquare size={14} className="text-teal" />
                        <span>Fitted Hospital Linen & Pillow Installation</span>
                      </div>
                      <div className="protocol-item checked">
                        <CheckSquare size={14} className="text-teal" />
                        <span>Bio-Hazard Waste Bin Cleared & Lined</span>
                      </div>
                    </div>

                    <div className="cleaning-action-area">
                      {needsCleaningStart && (
                        <button
                          type="button"
                          className="btn btn-primary w-full"
                          onClick={() => startCleaning(c.id)}
                          disabled={isProcessing}
                        >
                          <Play size={14} /> Start Sanitisation Protocol
                        </button>
                      )}

                      {isSanitizing && (
                        <div className="cleaning-actions-row">
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ flex: 1, background: '#0d9488' }}
                            onClick={() => handleOpenChecklistModal(c.id)}
                            disabled={isProcessing}
                          >
                            <Zap size={14} /> Complete & Trigger AI Scan
                          </button>
                        </div>
                      )}

                      {isAnomaly && (
                        <button
                          type="button"
                          className="btn btn-danger w-full"
                          onClick={() => handleOpenChecklistModal(c.id)}
                          disabled={isProcessing}
                        >
                          <RotateCcw size={14} /> Re-sanitise & Trigger AI Re-scan
                        </button>
                      )}

                      {isReady && (
                        <div className="bed-ready-banner">
                          <CheckCircle2 size={16} className="text-green" />
                          <span>Confirmed Turnaround Complete by AI Camera</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="housekeeping-card-footer">
                    <div className="footer-meta">
                      <Clock size={12} />
                      <span>Priority: <strong>{c.priority}</strong></span>
                    </div>
                    <span className="camera-feed-label">
                      📷 {c.aiInspection?.cameraId || 'CAM-NODE-ONLINE'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Checklist & Verification Modal */}
      {activeChecklistCaseId && (
        <div className="search-modal-backdrop" onClick={() => setActiveChecklistCaseId(null)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Sparkles size={20} className="text-teal" />
                <h3>7-Step Terminal Disinfection Sign-Off</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveChecklistCaseId(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <p className="form-hint">
                Confirm all cleaning protocols are executed before triggering the overhead AI Camera Optical Scan.
              </p>

              <div className="checklist-items-stack">
                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.linensBagged}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, linensBagged: e.target.checked }))}
                  />
                  <div>
                    <strong>1. Soiled Linens Removed & Bagged</strong>
                    <span>Infectious & non-infectious color bags sealed</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.frameDisinfected}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, frameDisinfected: e.target.checked }))}
                  />
                  <div>
                    <strong>2. Complete Frame & Mattress Sanitisation</strong>
                    <span>Hospital-grade quaternary ammonium solution applied</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.railsSanitized}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, railsSanitized: e.target.checked }))}
                  />
                  <div>
                    <strong>3. Bed Rails & Control Pendant Cleaned</strong>
                    <span>High-touch electrical surfaces disinfected</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.wasteDisposed}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, wasteDisposed: e.target.checked }))}
                  />
                  <div>
                    <strong>4. Bio-medical Waste Cleared & Relined</strong>
                    <span>Fresh puncture-proof bags installed</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.floorMopped}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, floorMopped: e.target.checked }))}
                  />
                  <div>
                    <strong>5. Terminal Floor Mopping & Odor Clearance</strong>
                    <span>Floor clean and dry; zero trip hazards</span>
                  </div>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveChecklistCaseId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#0d9488' }}
                  onClick={() => handleCompleteCleaningWithScan(activeChecklistCaseId)}
                  disabled={isProcessing}
                >
                  <Zap size={16} /> Submit & Run AI Camera Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
