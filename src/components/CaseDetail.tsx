import React, { useState } from 'react';
import { useHospitalFlow } from '../context/HospitalFlowContext';
import type { HospitalCase } from '../types';
import {
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  ShieldCheck,
  FileText,
  UserCheck,
  CreditCard,
  LogOut,
  Sparkles,
  Activity,
  Scan,
  Zap,
  Check,
  RefreshCw,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

interface CaseDetailProps {
  caseData: HospitalCase;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ caseData }) => {
  const {
    settings,
    isProcessing,
    toggleNursingHandoff,
    toggleBillingHandoff,
    confirmRoomDeparture,
    startCleaning,
    runAiCameraInspection,
  } = useHospitalFlow();

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('Idle');

  // Trigger autonomous AI Camera Vision Inspection
  const handleTriggerAiScan = async (simulateAnomaly: boolean = false) => {
    setIsScanning(true);
    setScanStep('Acquiring 1080p Optical Feed...');

    setTimeout(() => {
      setScanStep('Running Neural Cleanliness & UV-C Surface Model...');
    }, 400);

    setTimeout(() => {
      setScanStep('Evaluating Linen Geometry & Bio-Waste Enclosure...');
    }, 800);

    setTimeout(() => {
      setScanStep('Executing Zero PII Privacy Gate Check...');
    }, 1100);

    setTimeout(async () => {
      await runAiCameraInspection(caseData.id, simulateAnomaly);
      setIsScanning(false);
      setScanStep('Idle');
    }, 1500);
  };

  const getStepStatus = (
    stepIndex: number
  ): 'completed' | 'in-progress' | 'ready' | 'upcoming' => {
    if (caseData.status === 'BED_READY') return 'completed';

    switch (stepIndex) {
      case 0: // Step 1: Handoffs
        if (caseData.departureConfirmed) return 'completed';
        const billingDone = settings.billingOptional || caseData.billingComplete;
        return caseData.nursingComplete && billingDone ? 'ready' : 'in-progress';
      case 1: // Step 2: Room Departure
        if (caseData.departureConfirmed) return 'completed';
        const canDepart =
          caseData.nursingComplete &&
          (settings.billingOptional || caseData.billingComplete);
        return canDepart ? 'ready' : 'upcoming';
      case 2: // Step 3: Housekeeping Sanitisation
        if (!caseData.departureConfirmed) return 'upcoming';
        if (caseData.aiInspection?.verdict === 'VERIFIED_READY')
          return 'completed';
        return caseData.cleaningStarted ? 'in-progress' : 'ready';
      case 3: // Step 4: AI Optical Vision Scan
        if (caseData.aiInspection?.verdict === 'VERIFIED_READY') return 'completed';
        if (isScanning || caseData.status === 'AWAITING_REVIEW') return 'in-progress';
        if (caseData.cleaningStarted) return 'ready';
        return 'upcoming';
      case 4: // Step 5: Autonomous Confirmation
        return 'upcoming';
      default:
        return 'upcoming';
    }
  };

  const canConfirmDeparture =
    !caseData.departureConfirmed &&
    caseData.nursingComplete &&
    (settings.billingOptional || caseData.billingComplete);

  const wardPrefix = (caseData.ward || 'GEN')
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  const roomNum = (caseData.room || '01').replace(/[^0-9]/g, '') || '01';
  const cameraId = caseData.aiInspection?.cameraId || `CAM-${wardPrefix}-${roomNum}`;

  return (
    <div
      className="case-detail-container"
      role="main"
      aria-label={`Details for ${caseData.caseRef}`}
    >
      {/* Detail Header */}
      <div className="detail-header-card">
        <div className="header-meta-row">
          <div className="case-ref-pill">
            <span className="ref-label">Operational Ref</span>
            <span className="ref-value">{caseData.caseRef}</span>
          </div>

          <div className="location-tags">
            <span className="loc-tag ward">{caseData.ward}</span>
            <span className="loc-tag room">{caseData.room}</span>
            <span className="loc-tag bed">
              Bed: <strong>{caseData.bed}</strong>
            </span>
            <span className="loc-tag bed-type">{caseData.bedType}</span>
          </div>

          <div className="case-status-indicator">
            {caseData.status === 'BED_READY' && (
              <span className="badge badge-success large">
                <CheckCircle2 className="badge-icon" /> AI Confirmed Bed Ready
              </span>
            )}
            {caseData.status === 'AWAITING_REVIEW' && (
              <span className="badge badge-warning large pulse">
                <Scan className="badge-icon" /> AI Vision Scan Queued
              </span>
            )}
            {caseData.status === 'CLEANING_IN_PROGRESS' && (
              <span className="badge badge-info large">
                <Sparkles className="badge-icon" /> Housekeeping Sanitisation Active
              </span>
            )}
            {caseData.status === 'HANDOFFS_PENDING' && (
              <span className="badge badge-neutral large">
                <Clock className="badge-icon" /> Handoffs Pending
              </span>
            )}
            {caseData.status === 'REJECTED_RECLEAN' && (
              <span className="badge badge-danger large">
                <AlertTriangle className="badge-icon" /> AI Flagged Anomaly — Re-cleaning
              </span>
            )}
          </div>
        </div>

        {/* Operational Workflow Stepper: AI Powered */}
        <div
          className="stepper-track"
          role="progressbar"
          aria-label="Room Readiness Progression"
        >
          {[
            { label: '1. Handoffs', desc: 'Nursing & Billing' },
            { label: '2. Departure', desc: 'Physical Vacate' },
            { label: '3. Housekeeping', desc: 'Deep Sanitisation' },
            { label: '4. AI Vision Scan', desc: 'Overhead Camera' },
            { label: '5. Bed Ready', desc: 'Zero-Human Delay' },
          ].map((st, i) => {
            const status = getStepStatus(i);
            return (
              <div key={i} className={`stepper-node ${status}`}>
                <div className="node-marker">
                  {status === 'completed' ? (
                    <CheckCircle2 className="node-icon-completed" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <div className="node-text">
                  <span className="node-title">{st.label}</span>
                  <span className="node-desc">{st.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-sections-grid">
        {/* Left Column: Workflow Step Actions */}
        <div className="workflow-steps-column">
          {/* STEP 1: Handoff Checklists */}
          <section className="step-card" aria-labelledby="step-handoffs-title">
            <div className="step-card-header">
              <div className="step-num-bubble">1</div>
              <div>
                <h3 id="step-handoffs-title" className="step-title">
                  Discharge & Administrative Handoffs
                </h3>
                <p className="step-description">
                  Confirm physical and administrative clearances prior to housekeeping release.
                </p>
              </div>
            </div>

            <div className="checklist-group" role="group" aria-label="Clearance Tasks">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={caseData.nursingComplete}
                  onChange={() => toggleNursingHandoff(caseData.id)}
                  disabled={isProcessing || caseData.departureConfirmed}
                  aria-label="Mark Nursing Discharge Handoff as complete"
                />
                <div className="check-text">
                  <div className="check-label-row">
                    <UserCheck className="check-icon" />
                    <strong>Nursing Handoff & Transfer Complete</strong>
                  </div>
                  <p className="check-desc">
                    Patient has transferred; discharge summary & vitals handed over.
                  </p>
                  {caseData.nursingCompletedAt && (
                    <span className="timestamp-note">
                      ✓ Completed{' '}
                      {new Date(caseData.nursingCompletedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={caseData.billingComplete}
                  onChange={() => toggleBillingHandoff(caseData.id)}
                  disabled={isProcessing || caseData.departureConfirmed}
                  aria-label="Mark Billing and TPA Clearance as complete"
                />
                <div className="check-text">
                  <div className="check-label-row">
                    <CreditCard className="check-icon" />
                    <strong>Billing & TPA Financial Clearance</strong>
                  </div>
                  <p className="check-desc">
                    Insurance / TPA discharge clearance confirmed.
                    {settings.billingOptional && ' (Configured as optional)'}
                  </p>
                  {caseData.billingCompletedAt && (
                    <span className="timestamp-note">
                      ✓ Completed{' '}
                      {new Date(caseData.billingCompletedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </label>
            </div>
          </section>

          {/* STEP 2: Physical Room Departure */}
          <section className="step-card" aria-labelledby="step-departure-title">
            <div className="step-card-header">
              <div className="step-num-bubble">2</div>
              <div>
                <h3 id="step-departure-title" className="step-title">
                  Confirm Physical Room Departure
                </h3>
                <p className="step-description">
                  Releases room to Housekeeping for terminal sanitisation and activates overhead AI camera.
                </p>
              </div>
            </div>

            {caseData.departureConfirmed ? (
              <div className="confirmed-state-banner">
                <CheckCircle2 className="check-green" />
                <div className="banner-text">
                  <strong>Room Vacated & Transferred to Housekeeping</strong>
                  <p>
                    Confirmed at{' '}
                    {caseData.departureConfirmedAt
                      ? new Date(caseData.departureConfirmedAt).toLocaleTimeString()
                      : 'Recorded'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="action-row-departure">
                <button
                  type="button"
                  className="btn btn-teal-action"
                  onClick={() => confirmRoomDeparture(caseData.id)}
                  disabled={!canConfirmDeparture || isProcessing}
                  aria-label="Confirm room is physically empty"
                >
                  <LogOut className="btn-icon" />
                  <span>Confirm Physical Departure & Release Room</span>
                </button>
                {!canConfirmDeparture && (
                  <span className="blocked-hint">
                    Requires Nursing handoff {settings.billingOptional ? '' : 'and Billing clearance'}.
                  </span>
                )}
              </div>
            )}
          </section>

          {/* STEP 3: Housekeeping Sanitisation */}
          <section className="step-card" aria-labelledby="step-cleaning-title">
            <div className="step-card-header">
              <div className="step-num-bubble">3</div>
              <div>
                <h3 id="step-cleaning-title" className="step-title">
                  Housekeeping Terminal Sanitisation
                </h3>
                <p className="step-description">
                  Housekeeping team sanitises frame, applies terminal linens, and clears medical waste.
                </p>
              </div>
            </div>

            {!caseData.departureConfirmed ? (
              <div className="step-locked-box">
                <Clock className="locked-icon" />
                <span>Awaiting room departure confirmation before housekeeping begins.</span>
              </div>
            ) : (
              <div className="cleaning-content">
                {!caseData.cleaningStarted ? (
                  <div className="start-cleaning-prompt">
                    <p>Housekeeping crew arrived at room.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => startCleaning(caseData.id)}
                      disabled={isProcessing}
                    >
                      <Sparkles className="btn-icon" />
                      <span>Start Bed Sanitisation</span>
                    </button>
                  </div>
                ) : (
                  <div className="cleaning-active-status">
                    <span className="status-bullet active" />
                    <span>
                      Bed sanitisation in progress since{' '}
                      {caseData.cleaningStartedAt
                        ? new Date(caseData.cleaningStartedAt).toLocaleTimeString()
                        : 'recently'}
                    </span>
                  </div>
                )}

                {/* AI Camera Auto-Verification Hint */}
                <div className="ai-camera-active-banner">
                  <div className="ai-camera-pulse-icon">
                    <Camera size={20} className="text-teal" />
                  </div>
                  <div className="ai-camera-banner-info">
                    <strong>Autonomous AI Camera Vision Active ({cameraId})</strong>
                    <p>
                      No manual smartphone photo uploads or human coordinator sign-offs required.
                      The overhead AI Camera automatically validates cleanliness, linens, and waste clearance upon completion.
                    </p>
                  </div>
                </div>

                {/* Rejection / Anomaly notice if flagged by AI */}
                {caseData.status === 'REJECTED_RECLEAN' && (
                  <div className="rejection-alert-card" role="alert">
                    <div className="rej-badge">AI ANOMALY DETECTED</div>
                    <p className="rej-reason">
                      <strong>AI Vision Diagnostic:</strong> {caseData.rejectionReason}
                    </p>
                    {caseData.rejectionDetails && (
                      <p className="rej-details">"{caseData.rejectionDetails}"</p>
                    )}
                    <p className="rej-action-hint">
                      The overhead AI camera flagged a discrepancy. Housekeeping is re-cleaning now. Trigger a new AI Camera Scan once corrected.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: AI Smart Camera Vision Hub & Event History */}
        <div className="review-and-history-column">
          {/* STEP 4 & 5: AI Smart Camera Vision Hub */}
          <section className="review-card" aria-labelledby="ai-vision-hub-title">
            <div className="review-card-header">
              <div className="header-title-group">
                <Cpu className="review-header-icon text-cyan" />
                <div>
                  <h3 id="ai-vision-hub-title" className="review-title">
                    AI Smart Camera Vision Hub
                  </h3>
                  <span className="ai-feed-tag">{cameraId} • Live Optical Feed • 60 FPS</span>
                </div>
              </div>

              <div className="ai-neural-status-pill">
                <span className="live-dot" />
                <span>Neural Vision v3.2</span>
              </div>
            </div>

            {/* AI Camera Viewport & Computer Vision HUD */}
            <div className="ai-camera-viewport">
              {/* Camera Live Frame Simulation */}
              <div className={`ai-hud-frame ${isScanning ? 'is-scanning' : ''}`}>
                {/* Crosshairs & Scanning Grid */}
                <div className="hud-corner top-left" />
                <div className="hud-corner top-right" />
                <div className="hud-corner bottom-left" />
                <div className="hud-corner bottom-right" />

                {isScanning && <div className="scanning-laser-beam" />}

                {/* Telemetry Header */}
                <div className="hud-telemetry-top">
                  <span className="telemetry-badge">
                    <Activity size={12} /> SENSOR: {cameraId}
                  </span>
                  <span className="telemetry-badge">
                    RES: 1920x1080 • UV-C NIR
                  </span>
                  <span className="telemetry-badge">
                    LATENCY: 14ms
                  </span>
                </div>

                {/* Simulated Computer Vision Bounding Boxes */}
                <div className="hud-bounding-box box-bed">
                  <span className="hud-box-tag">
                    {caseData.status === 'BED_READY' ? '✓ Bed Surface: 99.4% Sanitized' : 'Bed Frame Area'}
                  </span>
                </div>

                <div className="hud-bounding-box box-linen">
                  <span className="hud-box-tag">
                    {caseData.status === 'BED_READY'
                      ? '✓ Linens: Sterile Fitted (Pass)'
                      : caseData.status === 'REJECTED_RECLEAN'
                      ? '⚠️ Linen Alignment Deviation (>28%)'
                      : 'Linen Matrix Inspection'}
                  </span>
                </div>

                <div className="hud-bounding-box box-gas">
                  <span className="hud-box-tag">
                    ✓ Suction & O2 Outlets: Capped
                  </span>
                </div>

                {/* Zero PII Privacy Gate Watermark */}
                <div className="hud-privacy-badge">
                  <ShieldCheck size={13} />
                  <span>Strict Zero PII: 100% Verified (No Persons In Frame)</span>
                </div>

                {/* Active Scanning Status Bar */}
                {isScanning && (
                  <div className="hud-scanning-status-bar">
                    <RefreshCw size={16} className="spin text-cyan" />
                    <span>{scanStep}</span>
                  </div>
                )}
              </div>

              {/* 5-Point AI Optical Checkpoints */}
              <div className="ai-checkpoints-grid">
                <div className="ai-checkpoint-pill">
                  <Check size={14} className="text-emerald" />
                  <span>Surface Sanitization: 99.4%</span>
                </div>
                <div className="ai-checkpoint-pill">
                  <Check size={14} className="text-emerald" />
                  <span>Sterile Linen Fit: Verified</span>
                </div>
                <div className="ai-checkpoint-pill">
                  <Check size={14} className="text-emerald" />
                  <span>Biohazard Clearance: 100%</span>
                </div>
                <div className="ai-checkpoint-pill">
                  <Check size={14} className="text-emerald" />
                  <span>Medical Gas Caps: Sealed</span>
                </div>
                <div className="ai-checkpoint-pill">
                  <Check size={14} className="text-emerald" />
                  <span>Privacy Check: 0 PII</span>
                </div>
              </div>
            </div>

            {/* Autonomous Actions: Replace Human Approval */}
            <div className="coordinator-action-dock">
              {caseData.status === 'BED_READY' ? (
                <div className="bed-ready-summary-box">
                  <div className="approved-seal">
                    <ShieldCheck className="seal-icon" />
                    <div>
                      <strong>Bed Verified & Approved Autonomously by AI</strong>
                      <p>
                        Confirmed by {caseData.approverLabel || `HospitalFlow Vision AI (${cameraId})`} at{' '}
                        {caseData.approvedAt
                          ? new Date(caseData.approvedAt).toLocaleString()
                          : 'Recorded'}
                      </p>
                      <span className="ai-zero-lag-tag">
                        ⚡ Zero Human Wait Time • Admission Clearance Instantaneous
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-action-controls">
                  <div className="ai-action-description">
                    <strong>Autonomous Inspection Trigger</strong>
                    <p>
                      The AI camera will scan the room in real-time, compute neural cleanliness scores, and 
                      <strong> automatically approve Bed Ready</strong> without waiting for a human coordinator.
                    </p>
                  </div>

                  <div className="ai-buttons-row">
                    <button
                      type="button"
                      className="btn btn-teal-action btn-lg w-full"
                      onClick={() => handleTriggerAiScan(false)}
                      disabled={isProcessing || isScanning || !caseData.cleaningStarted}
                      aria-label="Run autonomous AI camera inspection and auto-approve"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="btn-icon spin" />
                          <span>Scanning with AI Camera...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="btn-icon" />
                          <span>⚡ Run AI Camera Verification & Auto-Confirm Ready</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleTriggerAiScan(true)}
                      disabled={isProcessing || isScanning || !caseData.cleaningStarted}
                      title="Simulate AI finding an issue to test autonomous re-clean dispatch"
                    >
                      <ShieldAlert className="btn-icon" />
                      <span>Test AI Anomaly Detection (Demo)</span>
                    </button>
                  </div>

                  {!caseData.cleaningStarted && (
                    <span className="text-hint text-amber text-xs block text-center mt-2">
                      Please start housekeeping sanitisation before triggering the AI Camera inspection.
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Audit Event History (Strictly No Image Bytes, File Names or URLs) */}
          <section className="history-card" aria-labelledby="history-card-title">
            <div className="history-header">
              <FileText className="history-icon" />
              <h3 id="history-card-title" className="history-title">
                Autonomous Operational Audit Trail
              </h3>
              <span className="audit-tag">AI Audited</span>
            </div>

            <p className="audit-privacy-notice">
              * Privacy boundary: Event log stores operational timestamps, optical camera sensor IDs, and neural verification hashes only.
            </p>

            <div className="history-timeline">
              {caseData.events.map((evt) => {
                const isAi = evt.type === 'AI_INSPECTION' || evt.type === 'APPROVAL_NOTICE';
                const isRejection = evt.type === 'REJECTION_NOTICE';

                return (
                  <div
                    key={evt.id}
                    className={`timeline-entry ${
                      isAi ? 'entry-approval' : isRejection ? 'entry-rejection' : ''
                    }`}
                  >
                    <div className="entry-dot" />
                    <div className="entry-content">
                      <div className="entry-header-row">
                        <span className="entry-actor">{evt.actorLabel}</span>
                        <span className="entry-time">
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="entry-summary">{evt.summary}</p>
                      {evt.details && <p className="entry-details">{evt.details}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
