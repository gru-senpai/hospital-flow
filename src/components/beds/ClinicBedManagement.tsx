import React, { useState } from 'react';
import {
  Bed,
  Sparkles,
  ClipboardCheck,
  AlertTriangle,
  ArrowLeft,
  X,
  Filter,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { CaseList } from '../CaseList';
import { CaseDetail } from '../CaseDetail';
import { useHospitalFlow } from '../../context/HospitalFlowContext';

interface ClinicBedManagementProps {
  onOpenCreateCase: () => void;
}

export const ClinicBedManagement: React.FC<ClinicBedManagementProps> = ({
  onOpenCreateCase,
}) => {
  const {
    cases,
    activeCase,
    setActiveCaseId,
    approveBedReady,
    rejectBedPhoto,
    isProcessing,
  } = useHospitalFlow();

  const [viewMode, setViewMode] = useState<'turnaround' | 'ward_grid'>('turnaround');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [mobileDetailView, setMobileDetailView] = useState<'queue' | 'detail'>('queue');

  // Housekeeping Checklist Modal State
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistCaseId, setChecklistCaseId] = useState<string>('');
  const [checklist, setChecklist] = useState({
    linenRemoved: false,
    surfaceDisinfected: false,
    bedRailsSanitized: false,
    wasteDisposed: false,
    suctionOxygenTested: false,
    finalInspectionApproved: false,
  });
  const [checklistError, setChecklistError] = useState<string | null>(null);

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectCaseId, setRejectCaseId] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('SURFACE_UNCLEAN');
  const [rejectDetails, setRejectDetails] = useState<string>('Mattress undersurface requires re-disinfection');

  const wards = ['ALL', 'Ward 4B (Stepdown)', 'Ward 1 (Day Care)', 'ICU Ward 5A', 'Trauma Bay'];

  const filteredCases = cases.filter((c) => {
    if (selectedWard !== 'ALL' && c.ward !== selectedWard) return false;
    return true;
  });

  const handleSelectCase = (id: string) => {
    setActiveCaseId(id);
    setMobileDetailView('detail');
  };

  const handleOpenChecklist = (caseId: string) => {
    setChecklistCaseId(caseId);
    setChecklist({
      linenRemoved: true,
      surfaceDisinfected: true,
      bedRailsSanitized: true,
      wasteDisposed: true,
      suctionOxygenTested: true,
      finalInspectionApproved: false,
    });
    setChecklistError(null);
    setIsChecklistModalOpen(true);
  };

  const handleCompleteChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklist.linenRemoved || !checklist.surfaceDisinfected || !checklist.bedRailsSanitized || !checklist.wasteDisposed || !checklist.finalInspectionApproved) {
      setChecklistError('All core sanitization checks must be verified before submitting bed for verification.');
      return;
    }

    // Advance case to AWAITING_REVIEW via photo or simulation
    const targetCase = cases.find((c) => c.id === checklistCaseId);
    if (targetCase && targetCase.status === 'CLEANING_IN_PROGRESS') {
      // Complete checklist transition
      setIsChecklistModalOpen(false);
    }
  };

  const handleOpenReject = (caseId: string) => {
    setRejectCaseId(caseId);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectCaseId) return;
    await rejectBedPhoto(rejectCaseId, rejectReason as any, rejectDetails);
    setIsRejectModalOpen(false);
  };

  const handleApprove = async (caseId: string) => {
    await approveBedReady(caseId);
  };

  return (
    <div className="clinic-bed-workspace-root">
      {/* Top Controls Toolbar */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-tab-group">
            <button
              type="button"
              className={`toolbar-tab ${viewMode === 'turnaround' ? 'is-active' : ''}`}
              onClick={() => setViewMode('turnaround')}
            >
              <ClipboardCheck size={16} />
              <span>Turnaround Queue ({cases.length})</span>
            </button>
            <button
              type="button"
              className={`toolbar-tab ${viewMode === 'ward_grid' ? 'is-active' : ''}`}
              onClick={() => setViewMode('ward_grid')}
            >
              <Bed size={16} />
              <span>Ward Bed Grid ({filteredCases.length})</span>
            </button>
          </div>

          <div className="toolbar-filter-box">
            <Filter size={15} className="text-slate" />
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by ward"
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
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateCase}
          >
            <span>+ Create Turnaround Case</span>
          </button>
        </div>
      </div>

      {/* View Mode 1: Comprehensive Turnaround Workflow (Queue + Case Detail) */}
      {viewMode === 'turnaround' && (
        <div className={`operational-workspace mobile-${mobileDetailView}`}>
          <div className="workspace-queue-pane">
            <CaseList onSelectCase={handleSelectCase} />
          </div>

          <div className="workspace-detail-pane">
            <div className="mobile-back-bar">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileDetailView('queue')}
              >
                <ArrowLeft className="btn-icon" />
                <span>Back to Bed Queue</span>
              </button>
              {activeCase && (
                <span className="mobile-active-ref">
                  Viewing {activeCase.caseRef} ({activeCase.bed})
                </span>
              )}
            </div>

            {activeCase ? (
              <CaseDetail key={activeCase.id} caseData={activeCase} />
            ) : (
              <div className="no-case-selected-card">
                <div className="no-case-icon-box">
                  <Bed size={40} />
                </div>
                <h3>No Bed Turnaround Case Selected</h3>
                <p>
                  Select an operational bed case from the queue on the left, or initiate a new room
                  turnaround workflow.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onOpenCreateCase}
                >
                  + Create New Case
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Mode 2: Interactive Ward Grid Visualization */}
      {viewMode === 'ward_grid' && (
        <div className="ward-grid-workspace">
          <div className="ops-card mb-4">
            <div className="ops-card-header">
              <div>
                <h3>Ward Capacity & Physical Bed Matrix</h3>
                <p className="section-desc">
                  Visual coordinate map across rooms. Color coded by 7-step turnover status.
                </p>
              </div>
              <div className="legend-pills-row">
                <StatusBadge label="Bed Ready" tone="green" size="sm" />
                <StatusBadge label="Cleaning" tone="blue" size="sm" />
                <StatusBadge label="Awaiting Review" tone="amber" size="sm" />
                <StatusBadge label="Departure Pending" tone="slate" size="sm" />
              </div>
            </div>

            <div className="ward-bed-cards-matrix">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className={`ward-tile-card status-${c.status.toLowerCase()} ${activeCase?.id === c.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setActiveCaseId(c.id);
                    setViewMode('turnaround');
                  }}
                >
                  <div className="ward-tile-top">
                    <span className="ward-tile-id">{c.caseRef}</span>
                    <StatusBadge
                      label={c.status === 'BED_READY' ? 'READY' : c.status.replace(/_/g, ' ')}
                      tone={
                        c.status === 'BED_READY'
                          ? 'green'
                          : c.status === 'AWAITING_REVIEW'
                          ? 'amber'
                          : c.status === 'CLEANING_IN_PROGRESS'
                          ? 'blue'
                          : 'slate'
                      }
                      size="sm"
                    />
                  </div>

                  <div className="ward-tile-body">
                    <strong className="ward-tile-bed">{c.bed}</strong>
                    <span className="ward-tile-room">{c.ward} • {c.room}</span>
                    <span className="ward-tile-type">{c.bedType}</span>
                  </div>

                  <div className="ward-tile-footer">
                    {c.status === 'HANDOFFS_PENDING' && (
                      <span className="tile-action-hint">Handoffs in progress</span>
                    )}
                    {c.status === 'CLEANING_IN_PROGRESS' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="tile-action-hint text-blue">Sanitizing</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChecklist(c.id);
                          }}
                        >
                          Checklist
                        </button>
                      </div>
                    )}
                    {c.status === 'AWAITING_REVIEW' && (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(c.id);
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReject(c.id);
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {c.status === 'BED_READY' && (
                      <span className="tile-action-hint text-green">✓ Allocated & Ready</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Housekeeping Checklist Verification Modal */}
      {isChecklistModalOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsChecklistModalOpen(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Sparkles size={20} className="text-teal" />
                <h3>7-Step Housekeeping Sanitization Checklist</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsChecklistModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteChecklist} className="modal-form">
              <p className="form-hint">
                Standard Operational Protocol: Each step must be completed by authorized staff before the bed can enter the Coordinator Verification Queue.
              </p>

              <div className="checklist-items-stack">
                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.linenRemoved}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, linenRemoved: e.target.checked }))}
                  />
                  <div>
                    <strong>1. Soiled Linen & Pillow Removal</strong>
                    <span>Bagged in designated infectious / non-infectious laundry containers</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.surfaceDisinfected}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, surfaceDisinfected: e.target.checked }))}
                  />
                  <div>
                    <strong>2. Complete Mattress & Frame Disinfection</strong>
                    <span>High-level hospital-grade quaternary ammonium solution applied</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.bedRailsSanitized}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, bedRailsSanitized: e.target.checked }))}
                  />
                  <div>
                    <strong>3. Side Rails & Touchpoints Sanitized</strong>
                    <span>Brakes, electronic hand pendants, IV poles, and overbed table</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.wasteDisposed}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, wasteDisposed: e.target.checked }))}
                  />
                  <div>
                    <strong>4. Waste Disposal & Floor Mopping</strong>
                    <span>Bins lined with fresh bio-medical waste bags per color code</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.suctionOxygenTested}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, suctionOxygenTested: e.target.checked }))}
                  />
                  <div>
                    <strong>5. Wall Suction & Oxygen Outlets Check</strong>
                    <span>Flow verified, terminal connectors capped</span>
                  </div>
                </label>

                <label className="checklist-row">
                  <input
                    type="checkbox"
                    checked={checklist.finalInspectionApproved}
                    onChange={(e) => setChecklist((prev) => ({ ...prev, finalInspectionApproved: e.target.checked }))}
                  />
                  <div>
                    <strong>6. Final Housekeeping Supervisor Sign-off</strong>
                    <span>Room is odor-free, dry, and ready for floor coordinator review</span>
                  </div>
                </label>
              </div>

              {checklistError && (
                <div className="inline-alert alert-error" role="alert">
                  <AlertTriangle size={18} />
                  <span>{checklistError}</span>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsChecklistModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit for Coordinator Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection / Re-clean Modal */}
      {isRejectModalOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsRejectModalOpen(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <AlertTriangle size={20} className="text-red" />
                <h3>Reject Room Readiness & Request Re-clean</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsRejectModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-form">
              <p className="form-hint">
                Rejecting readiness sends this bed back to <strong>Housekeeping Cleaning</strong> status. An audit notice will be logged.
              </p>

              <div className="form-group">
                <label className="form-label">Deficiency Category</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="form-control"
                >
                  <option value="SURFACE_UNCLEAN">Surface Unclean or Stained</option>
                  <option value="LINEN_UNMADE">Linen Improperly Made or Wrinkled</option>
                  <option value="TRASH_REMAINS">Trash or Biological Debris Remaining</option>
                  <option value="BLURRY_OR_IMPROPER_ANGLE">Verification Photo Blurry / Non-compliant</option>
                  <option value="OTHER_OPERATIONAL">Other Operational Discrepancy</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Corrective Action Notes for Crew</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={rejectDetails}
                  onChange={(e) => setRejectDetails(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmReject}
                  disabled={isProcessing}
                >
                  Confirm Rejection & Re-clean
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
