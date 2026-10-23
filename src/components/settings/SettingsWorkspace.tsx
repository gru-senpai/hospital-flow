import React, { useState } from 'react';
import {
  Building,
  Sliders,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Save,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';

export const SettingsWorkspace: React.FC = () => {
  const { resetAllOperationalData, triggerSync } = useOperations();
  const { settings, updateSettings, resetToInitialDemoData } = useHospitalFlow();

  const [activeTab, setActiveTab] = useState<'facility' | 'thresholds' | 'rules' | 'data'>('rules');
  const [facilityName, setFacilityName] = useState('Apollo General Hospital - Metro Central');
  const [operationalZone, setOperationalZone] = useState('Asia/Kolkata (IST +05:30)');
  const [campCapacityThreshold, setCampCapacityThreshold] = useState(80);
  const [pharmacyBufferRatio, setPharmacyBufferRatio] = useState(50);
  const [billingRequired, setBillingRequired] = useState(!settings.billingOptional);
  const [photoRetentionHours, setPhotoRetentionHours] = useState(settings.approvedPhotoRetentionHours);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      billingOptional: !billingRequired,
      approvedPhotoRetentionHours: photoRetentionHours,
    });
    triggerSync();
    setSaveNotice('Operational workflow rules and safety policies updated successfully.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleResetEverything = async () => {
    if (window.confirm('Reset all demo records (beds, equipment, labs, pharmacy, trauma, staff, and alerts) to initial fresh states?')) {
      await resetToInitialDemoData();
      resetAllOperationalData();
      setSaveNotice('All synthetic demo databases successfully restored to initial benchmark state.');
      setTimeout(() => setSaveNotice(null), 3500);
    }
  };

  return (
    <div className="settings-workspace-page">
      {/* Top Tabs */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-tab-group">
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'rules' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              <Sliders size={16} />
              <span>Workflow & Turnaround Rules</span>
            </button>
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'thresholds' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('thresholds')}
            >
              <Layers size={16} />
              <span>Safety Thresholds</span>
            </button>
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'facility' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('facility')}
            >
              <Building size={16} />
              <span>Facility Profile</span>
            </button>
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'data' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <Database size={16} />
              <span>Demo State Management</span>
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <span className="roster-verified-pill">
            <ShieldCheck size={13} /> Coordinator Level Controls
          </span>
        </div>
      </div>

      {saveNotice && (
        <div className="inline-alert alert-success mb-4" role="status">
          <CheckCircle2 size={18} />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Tab 1: Workflow Rules */}
      {activeTab === 'rules' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Bed Turnaround & Clinical Handoff Policies</h3>
              <p className="section-desc">
                Enforce mandatory handoffs and verification protocols governing room turnaround transitions.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveRules} className="settings-form">
            <div className="setting-toggle-card">
              <div className="toggle-info">
                <strong>Mandatory Billing & TPA Financial Clearance</strong>
                <p>
                  When enabled, physical room departure cannot be confirmed until both Nursing Handoff and
                  Billing / TPA clearance are verified.
                </p>
              </div>
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={billingRequired}
                  onChange={(e) => setBillingRequired(e.target.checked)}
                />
                <span className="switch-slider" />
              </label>
            </div>

            <div className="setting-field-card">
              <div className="field-info">
                <strong>Verified Photo Retention Window (Hours)</strong>
                <p>
                  Time in hours after Coordinator approval before the bed inspection photo blob is
                  permanently deleted from client storage.
                </p>
              </div>
              <div className="field-input-box">
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={photoRetentionHours}
                  onChange={(e) => setPhotoRetentionHours(Number(e.target.value))}
                  className="form-control w-32"
                />
                <span className="unit-label">Hours (Default 48h)</span>
              </div>
            </div>

            <div className="setting-field-card">
              <div className="field-info">
                <strong>Pending Inspection Expiry Window</strong>
                <p>
                  Unreviewed photos awaiting coordinator approval expire automatically after 7 calendar days.
                </p>
              </div>
              <div className="field-input-box">
                <span className="font-semibold text-navy">7 Days (Fixed Safety Policy)</span>
              </div>
            </div>

            <div className="form-submit-row">
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Save Workflow Rules</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Thresholds */}
      {activeTab === 'thresholds' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Operational Alert Thresholds</h3>
              <p className="section-desc">
                Trigger autonomous warnings across the dashboard when department metrics approach safety limits.
              </p>
            </div>
          </div>

          <div className="settings-form">
            <div className="setting-field-card">
              <div className="field-info">
                <strong>Health Camp Allocation Warning Boundary (%)</strong>
                <p>
                  Triggers an operational alert when allocated camp resources reach this percentage of maximum configured capacity.
                </p>
              </div>
              <div className="field-input-box">
                <input
                  type="number"
                  min={50}
                  max={95}
                  value={campCapacityThreshold}
                  onChange={(e) => setCampCapacityThreshold(Number(e.target.value))}
                  className="form-control w-32"
                />
                <span className="unit-label">% of Total Capacity</span>
              </div>
            </div>

            <div className="setting-field-card">
              <div className="field-info">
                <strong>Critical Drug Buffer Ratio</strong>
                <p>
                  Items drop to CRITICAL status when remaining units fall below this percentage of the established minimum par level.
                </p>
              </div>
              <div className="field-input-box">
                <input
                  type="number"
                  min={20}
                  max={75}
                  value={pharmacyBufferRatio}
                  onChange={(e) => setPharmacyBufferRatio(Number(e.target.value))}
                  className="form-control w-32"
                />
                <span className="unit-label">% of Par Level</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Facility Profile */}
      {activeTab === 'facility' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Hospital Facility Node Configuration</h3>
              <p className="section-desc">
                Operational metadata for the active healthcare facility command center.
              </p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Facility Network Name</label>
              <input
                type="text"
                className="form-control"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Operational Timezone</label>
              <input
                type="text"
                className="form-control"
                value={operationalZone}
                onChange={(e) => setOperationalZone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active Coordination Departments</label>
              <div className="tag-cloud-wrap">
                <span className="dept-tag">Emergency & Trauma</span>
                <span className="dept-tag">Ward 4B (Stepdown ICU)</span>
                <span className="dept-tag">Ward 1 (Day Care Dialysis)</span>
                <span className="dept-tag">ICU Ward 5A</span>
                <span className="dept-tag">Operation Theatres (OT 1-4)</span>
                <span className="dept-tag">Diagnostic Biochemistry Lab</span>
                <span className="dept-tag">Emergency Pharmacy Formulary</span>
                <span className="dept-tag">Public Health Outreach</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Demo State Management */}
      {activeTab === 'data' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Synthetic Demonstration Environment</h3>
              <p className="section-desc">
                Reset or inspect local browser state across all 9 hospital coordination modules.
              </p>
            </div>
          </div>

          <div className="demo-reset-box">
            <div className="reset-info">
              <AlertTriangle size={24} className="text-amber" />
              <div>
                <strong>Restore Fresh Initial Demo Records</strong>
                <p>
                  Resets cases, equipment reservations, lab schedules, camp allocations, pharmacy stocks, trauma bays, and alerts to the standard demonstration baseline.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-danger"
              onClick={handleResetEverything}
            >
              <RotateCcw size={16} />
              <span>Reset All Synthetic Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
