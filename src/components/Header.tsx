import React from 'react';
import { useHospitalFlow } from '../context/HospitalFlowContext';
import {
  Bed,
  ShieldAlert,
  Clock,
  Settings,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  showBedActions: boolean;
  onOpenCreate: () => void;
  onOpenSimulation: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  showBedActions,
  onOpenCreate,
  onOpenSimulation,
  onOpenSettings,
}) => {
  const { storageSummary, resetToInitialDemoData, isProcessing } = useHospitalFlow();

  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand / Logo */}
        <div className="header-brand">
          <div className="brand-icon-box" aria-hidden="true">
            <Bed className="brand-icon" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">HospitalFlow</h1>
              <span className="demo-badge">SYNTHETIC DEMO</span>
            </div>
            <p className="brand-subtitle">
              Hospital Resource Coordination • India Prototype
            </p>
          </div>
        </div>

        {/* Operational Safeguard Banner */}
        <div className="pii-guard-pill" title="Strict Operational Boundary: No Patient Data">
          <ShieldAlert className="guard-icon" />
          <span className="guard-text">Operational Coordination Only • No PII / ABHA</span>
        </div>

        {/* Global Action Buttons */}
        {showBedActions && <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreate}
            aria-label="Create New Room Readiness Case"
          >
            <PlusCircle className="btn-icon" />
            <span>Create Case</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenSimulation}
            title="Demo Time Travel and Storage Diagnostics"
            aria-label="Simulation & Storage Controls"
          >
            <Clock className="btn-icon" />
            <span className="hide-on-mobile">Demo Controls</span>
            <span className="badge-count" title={`${storageSummary.totalPhotos} photos in IndexedDB`}>
              {storageSummary.totalPhotos} IDB
            </span>
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onOpenSettings}
            title="Configure Retention & Handoff Settings"
            aria-label="Workflow Settings"
          >
            <Settings className="btn-icon" />
            <span className="hide-on-tablet">Settings</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (window.confirm('Reset all demo cases and storage to fresh initial state?')) {
                resetToInitialDemoData();
              }
            }}
            disabled={isProcessing}
            title="Reset to Initial Demo State"
            aria-label="Reset Demo Data"
          >
            <RefreshCw className={`btn-icon ${isProcessing ? 'spin' : ''}`} />
            <span className="hide-on-tablet">Reset</span>
          </button>
        </div>}
      </div>
    </header>
  );
};
