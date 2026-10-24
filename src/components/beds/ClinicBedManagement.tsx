import React, { useState } from 'react';
import {
  Bed,
  ClipboardCheck,
  ArrowLeft,
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
    runAiCameraInspection,
    isProcessing,
  } = useHospitalFlow();

  const [viewMode, setViewMode] = useState<'turnaround' | 'ward_grid'>('turnaround');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [mobileDetailView, setMobileDetailView] = useState<'queue' | 'detail'>('queue');

  const wards = ['ALL', 'Ward 4B (Stepdown)', 'Ward 1 (Day Care)', 'ICU Ward 5A', 'Trauma Bay'];

  const filteredCases = cases.filter((c) => {
    if (selectedWard !== 'ALL' && c.ward !== selectedWard) return false;
    return true;
  });

  const handleSelectCase = (id: string) => {
    setActiveCaseId(id);
    setMobileDetailView('detail');
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
                <StatusBadge label="AI Confirmed Ready" tone="green" size="sm" />
                <StatusBadge label="Sanitizing" tone="blue" size="sm" />
                <StatusBadge label="AI Scan Queue" tone="amber" size="sm" />
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
                      label={
                        c.status === 'BED_READY'
                          ? 'AI READY'
                          : c.status === 'AWAITING_REVIEW'
                          ? 'AI SCANNING'
                          : c.status.replace(/_/g, ' ')
                      }
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
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px', background: '#0284c7' }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await runAiCameraInspection(c.id);
                          }}
                          disabled={isProcessing}
                        >
                          ⚡ AI Camera Scan
                        </button>
                      </div>
                    )}
                    {c.status === 'AWAITING_REVIEW' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="tile-action-hint text-amber">Camera Ready</span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px', background: '#0284c7' }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await runAiCameraInspection(c.id);
                          }}
                          disabled={isProcessing}
                        >
                          ⚡ Auto-Confirm
                        </button>
                      </div>
                    )}
                    {c.status === 'BED_READY' && (
                      <span className="tile-action-hint text-green">✓ Confirmed Ready by AI Vision</span>
                    )}
                    {c.status === 'REJECTED_RECLEAN' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span className="tile-action-hint text-red">AI Anomaly</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await runAiCameraInspection(c.id);
                          }}
                          disabled={isProcessing}
                        >
                          Re-scan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
