import React, { useState } from 'react';
import { useHospitalFlow } from '../context/HospitalFlowContext';
import { Settings, X, Save, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useHospitalFlow();

  const [billingOptional, setBillingOptional] = useState(settings.billingOptional);
  const [pendingDays, setPendingDays] = useState(settings.pendingPhotoExpiryDays);
  const [retentionHours, setRetentionHours] = useState(settings.approvedPhotoRetentionHours);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      billingOptional,
      pendingPhotoExpiryDays: Number(pendingDays) || 7,
      approvedPhotoRetentionHours: Number(retentionHours) || 48,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="icon-badge-neutral">
              <Settings className="modal-icon" />
            </div>
            <div>
              <h3 id="settings-title" className="modal-title">
                Workflow & Retention Settings
              </h3>
              <p className="modal-subtitle">
                Configure operational prototype parameters and retention rules
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          <div className="settings-stack">
            {/* Setting 1: Billing Optional */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Make Billing / TPA Handoff Optional</span>
                <p className="setting-desc">
                  When enabled, Room Departure can be confirmed even if Billing / TPA clearance has not
                  been marked complete (treats billing as a non-blocking operational placeholder).
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={billingOptional}
                  onChange={(e) => setBillingOptional(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Setting 2: Approved Photo Retention Period */}
            <div className="setting-row-input">
              <div className="setting-info">
                <span className="setting-label">Approved Photo Retention (Hours)</span>
                <p className="setting-desc">
                  Time in hours after Coordinator approval before the bed verification photo is
                  automatically deleted from facility Firebase Storage. Default is 48 hours.
                </p>
              </div>
              <div className="setting-input-wrapper">
                <input
                  type="number"
                  min={1}
                  max={720}
                  className="form-input number-input"
                  value={retentionHours}
                  onChange={(e) => setRetentionHours(Number(e.target.value))}
                />
                <span className="unit-label">hours</span>
              </div>
            </div>

            {/* Setting 3: Pending Review Photo Expiry */}
            <div className="setting-row-input">
              <div className="setting-info">
                <span className="setting-label">Pending-Review Photo Expiry (Days)</span>
                <p className="setting-desc">
                  Time in days before an unreviewed housekeeping photo expires and requires a new capture.
                  Default is 7 days.
                </p>
              </div>
              <div className="setting-input-wrapper">
                <input
                  type="number"
                  min={1}
                  max={30}
                  className="form-input number-input"
                  value={pendingDays}
                  onChange={(e) => setPendingDays(Number(e.target.value))}
                />
                <span className="unit-label">days</span>
              </div>
            </div>
          </div>

          <div className="privacy-compliance-box">
            <ShieldCheck className="box-icon" />
            <div>
              <strong>Prototype Retention Assumption</strong>
              <p>
                In a production cloud environment, scheduled Object Lifecycle Management (e.g. S3
                Lifecycle rules or Cloud Storage auto-delete) enforces server-side deletion. In this
                client prototype, the signed-in app checks the configured retention timestamps. A production deployment should add a server-side scheduled cleanup and monitor its results.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save className="btn-icon" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
