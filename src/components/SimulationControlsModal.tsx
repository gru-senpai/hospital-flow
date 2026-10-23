import React, { useState } from 'react';
import { useHospitalFlow } from '../context/HospitalFlowContext';
import {
  Clock,
  HardDrive,
  FastForward,
  RotateCcw,
  X,
  CheckCircle,
} from 'lucide-react';

interface SimulationControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationControlsModal: React.FC<SimulationControlsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    storageSummary,
    simulateTimeFastForward,
    resetToInitialDemoData,
    isProcessing,
  } = useHospitalFlow();

  const [simMessage, setSimMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFastForward = async (hours: number) => {
    setSimMessage(null);
    const res = await simulateTimeFastForward(hours);
    setSimMessage(res.error
      ? res.error
      : `Fast-forward +${hours}h simulated. ${res.purgedCount} photo(s) exceeded retention criteria and were permanently purged.`);
  };

  const handleReset = async () => {
    if (window.confirm('Reset all demo cases and reseed initial synthetic scenarios?')) {
      await resetToInitialDemoData();
      onClose();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="sim-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="icon-badge-amber">
              <Clock className="modal-icon" />
            </div>
            <div>
              <h3 id="sim-title" className="modal-title">
                Demo Retention & Simulation Controls
              </h3>
              <p className="modal-subtitle">
                Tools to verify 48h approved purge and 7d pending review expiration without waiting
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-scroll">
          {simMessage && (
            <div className="form-info-banner" role="status">
              <CheckCircle className="banner-icon-sm" />
              <span>{simMessage}</span>
            </div>
          )}

          {/* SECTION 1: Facility Cloud Storage Diagnostics */}
          <section className="simulation-section">
            <h4 className="section-heading">
              <HardDrive className="section-icon" />
              <span>Facility Firebase Storage Diagnostic</span>
            </h4>
            <div className="diagnostic-grid">
              <div className="diag-box">
                <span className="diag-label">Photos in Firebase Storage</span>
                <span className="diag-value">{storageSummary.totalPhotos}</span>
              </div>
              <div className="diag-box">
                <span className="diag-label">Stored image size</span>
                <span className="diag-value">{formatBytes(storageSummary.totalSizeBytes)}</span>
              </div>
              <div className="diag-box">
                <span className="diag-label">Pending Approval</span>
                <span className="diag-value">{storageSummary.pendingCount}</span>
              </div>
              <div className="diag-box">
                <span className="diag-label">Approved (In Retention)</span>
                <span className="diag-value">{storageSummary.approvedCount}</span>
              </div>
            </div>

            <p className="diag-note">
              Images are stored in facility-scoped Firebase Storage with authenticated access rules.
              Download URLs are not saved in workflow records.
            </p>
          </section>

          {/* SECTION 2: Retention Fast-Forward Actions */}
          <section className="simulation-section">
            <h4 className="section-heading">
              <FastForward className="section-icon" />
              <span>Simulate Passage of Time (Purge Verification)</span>
            </h4>
            <p className="section-desc">
              Test automated deletion of photos based on the prototype retention rules:
            </p>

            <div className="sim-buttons-stack">
              <div className="sim-action-card">
                <div>
                  <strong>Fast-Forward +48 Hours</strong>
                  <p>
                    Purges approved photos whose 48-hour retention window has passed. Preserves bed-ready
                    approval audit notice.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleFastForward(48)}
                  disabled={isProcessing}
                >
                  <Clock className="btn-icon" />
                  <span>+48 Hours</span>
                </button>
              </div>

              <div className="sim-action-card">
                <div>
                  <strong>Fast-Forward +7 Days</strong>
                  <p>
                    Purges pending-review photos that were never reviewed within the 7-day limit.
                    Requires fresh photo before case can proceed.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleFastForward(168)}
                  disabled={isProcessing}
                >
                  <Clock className="btn-icon" />
                  <span>+7 Days</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 3: Reset Demo Data */}
          <section className="simulation-section">
            <h4 className="section-heading">
              <RotateCcw className="section-icon" />
              <span>Reset Prototype Environment</span>
            </h4>
            <p className="section-desc">
              Resets the synthetic bed-turnaround cases and removes their associated photos. Other facility workflows are unchanged.
            </p>
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={handleReset}
              disabled={isProcessing}
            >
              <RotateCcw className="btn-icon" />
              <span>Reset Bed Demo Cases & Photos</span>
            </button>
          </section>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
