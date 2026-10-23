import React, { useState, useEffect } from 'react';
import { useHospitalFlow } from '../context/HospitalFlowContext';
import type { HospitalCase } from '../types';
import { photoStorage } from '../services/db';
import { generateSyntheticBedPhotoBlob } from '../services/storage';
import { RejectionModal } from './RejectionModal';
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
  Eye,
  Trash2,
  Layers,
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
    uploadPhoto,
    approveBedReady,
    rejectBedPhoto,
    purgePhotoNow,
  } = useHospitalFlow();

  const [photoObjectUrl, setPhotoObjectUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState<boolean>(false);
  const [photoLoadError, setPhotoLoadError] = useState<string | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState<boolean>(false);
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now());

  // Load photo blob safely from IndexedDB when case or photo status changes
  useEffect(() => {
    let activeUrl: string | null = null;
    let isMounted = true;

    async function loadPhoto() {
      if (!caseData.photoUploaded || caseData.photoPurged) {
        setPhotoObjectUrl(null);
        setPhotoLoadError(null);
        return;
      }

      setPhotoLoading(true);
      setPhotoLoadError(null);

      try {
        const record = await photoStorage.getPhoto(caseData.id);
        if (!isMounted) return;

        if (record && record.blob) {
          activeUrl = URL.createObjectURL(record.blob);
          setPhotoObjectUrl(activeUrl);
        } else {
          setPhotoObjectUrl(null);
          // If record doesn't exist in IndexedDB but case thought it did
          if (caseData.status === 'AWAITING_REVIEW' || caseData.status === 'BED_READY') {
            setPhotoLoadError('Photo record is absent from IndexedDB (may have been cleared or expired).');
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Storage read error';
        setPhotoLoadError(msg);
      } finally {
        if (isMounted) setPhotoLoading(false);
      }
    }

    loadPhoto();

    // Revoke object URL on unmount or before reloading new photo
    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [caseData.id, caseData.photoUploaded, caseData.photoPurged, caseData.photoUploadedAt]);

  // Stepper calculations
  const getStepStatus = (stepIndex: number) => {
    // 0: Handoffs, 1: Departure, 2: Housekeeping, 3: Approval, 4: Bed Ready
    if (caseData.status === 'BED_READY') return 'completed';

    switch (stepIndex) {
      case 0:
        if (caseData.departureConfirmed) return 'completed';
        const billingDone = settings.billingOptional || caseData.billingComplete;
        return caseData.nursingComplete && billingDone ? 'ready' : 'in-progress';
      case 1:
        if (caseData.departureConfirmed) return 'completed';
        const canDepart = caseData.nursingComplete && (settings.billingOptional || caseData.billingComplete);
        return canDepart ? 'ready' : 'upcoming';
      case 2:
        if (!caseData.departureConfirmed) return 'upcoming';
        if (caseData.photoUploaded) return 'completed';
        return caseData.cleaningStarted ? 'in-progress' : 'ready';
      case 3:
        return caseData.status === 'AWAITING_REVIEW' ? 'in-progress' : 'upcoming';
      case 4:
        return 'upcoming';
      default:
        return 'upcoming';
    }
  };

  const canConfirmDeparture =
    !caseData.departureConfirmed &&
    caseData.nursingComplete &&
    (settings.billingOptional || caseData.billingComplete);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await uploadPhoto(caseData.id, file);
    setFileInputKey(Date.now());
  };

  const handleUseSyntheticPhoto = async () => {
    const synthBlob = generateSyntheticBedPhotoBlob(caseData.caseRef, caseData.bed);
    await uploadPhoto(caseData.id, synthBlob, 'image/svg+xml');
  };

  const formatExpiryTime = (isoString?: string) => {
    if (!isoString) return 'Not set';
    const expiryTime = new Date(isoString).getTime();
    const diffMs = expiryTime - Date.now();
    if (diffMs <= 0) return 'Expired (Purge due)';

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      const remHours = diffHours % 24;
      return `${days}d ${remHours}h remaining`;
    }
    return `${diffHours}h ${diffMinutes}m remaining`;
  };

  return (
    <div className="case-detail-container" role="main" aria-label={`Details for ${caseData.caseRef}`}>
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
                <CheckCircle2 className="badge-icon" /> Bed Ready & Approved
              </span>
            )}
            {caseData.status === 'AWAITING_REVIEW' && (
              <span className="badge badge-warning large pulse">
                <AlertTriangle className="badge-icon" /> Awaiting Coordinator Approval
              </span>
            )}
            {caseData.status === 'CLEANING_IN_PROGRESS' && (
              <span className="badge badge-info large">
                <Sparkles className="badge-icon" /> Housekeeping Active
              </span>
            )}
            {caseData.status === 'HANDOFFS_PENDING' && (
              <span className="badge badge-neutral large">
                <Clock className="badge-icon" /> Handoffs Pending
              </span>
            )}
            {caseData.status === 'REJECTED_RECLEAN' && (
              <span className="badge badge-danger large">
                <AlertTriangle className="badge-icon" /> Re-clean Requested
              </span>
            )}
          </div>
        </div>

        {/* Operational Workflow Stepper */}
        <div className="stepper-track" role="progressbar" aria-label="Room Readiness Progression">
          {[
            { label: '1. Handoffs', desc: 'Nursing & Billing' },
            { label: '2. Departure', desc: 'Room Vacated' },
            { label: '3. Housekeeping', desc: 'Cleaning & Photo' },
            { label: '4. Coordinator', desc: 'Bed Approval' },
            { label: '5. Bed Ready', desc: 'Turnaround Done' },
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

            <div className="checklist-container">
              {/* Nursing Checklist */}
              <div
                className={`checklist-item ${
                  caseData.nursingComplete ? 'item-complete' : 'item-pending'
                }`}
              >
                <div className="checklist-left">
                  <div className="item-icon-box">
                    <UserCheck className="item-icon" />
                  </div>
                  <div>
                    <span className="checklist-label">Nursing Handoff</span>
                    <p className="checklist-subtext">
                      Patient transfer acknowledged; clinical charts and bedside medication reconciled.
                    </p>
                    {caseData.nursingCompletedAt && (
                      <span className="completed-timestamp">
                        ✓ Completed {new Date(caseData.nursingCompletedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn-checklist ${
                    caseData.nursingComplete ? 'checked' : 'unchecked'
                  }`}
                  onClick={() => toggleNursingHandoff(caseData.id)}
                  disabled={caseData.departureConfirmed || isProcessing}
                  aria-label="Toggle Nursing Handoff"
                >
                  {caseData.nursingComplete ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
              </div>

              {/* Billing / TPA Checklist */}
              <div
                className={`checklist-item ${
                  caseData.billingComplete ? 'item-complete' : 'item-pending'
                }`}
              >
                <div className="checklist-left">
                  <div className="item-icon-box">
                    <CreditCard className="item-icon" />
                  </div>
                  <div>
                    <div className="checklist-label-row">
                      <span className="checklist-label">Billing / TPA Clearance</span>
                      <span className="placeholder-tag">Operational Placeholder</span>
                      {settings.billingOptional && (
                        <span className="optional-tag">Optional in Settings</span>
                      )}
                    </div>
                    <p className="checklist-subtext">
                      Administrative pre-auth clearance check (simulated placeholder for demo flow).
                    </p>
                    {caseData.billingCompletedAt && (
                      <span className="completed-timestamp">
                        ✓ Cleared {new Date(caseData.billingCompletedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn-checklist ${
                    caseData.billingComplete ? 'checked' : 'unchecked'
                  }`}
                  onClick={() => toggleBillingHandoff(caseData.id)}
                  disabled={caseData.departureConfirmed || isProcessing}
                  aria-label="Toggle Billing / TPA Clearance"
                >
                  {caseData.billingComplete ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
              </div>
            </div>
          </section>

          {/* STEP 2: Room Departure Confirmation */}
          <section className="step-card" aria-labelledby="step-departure-title">
            <div className="step-card-header">
              <div className="step-num-bubble">2</div>
              <div>
                <h3 id="step-departure-title" className="step-title">
                  Room Departure Confirmation
                </h3>
                <p className="step-description">
                  Confirm the previous patient has physically departed, freeing the room for sanitisation.
                </p>
              </div>
            </div>

            <div className="departure-action-box">
              {caseData.departureConfirmed ? (
                <div className="confirmed-banner">
                  <CheckCircle2 className="banner-icon" />
                  <div>
                    <strong>Room Departure Confirmed</strong>
                    <p>
                      Vacated at{' '}
                      {caseData.departureConfirmedAt
                        ? new Date(caseData.departureConfirmedAt).toLocaleString()
                        : 'Recorded'}
                      . Room transitioned to Housekeeping queue.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pending-departure-controls">
                  <p className="departure-prereq-note">
                    {canConfirmDeparture
                      ? '✓ Both handoffs are satisfied. Ready to confirm room departure.'
                      : '⚠️ Complete nursing handoff ' +
                        (!settings.billingOptional ? 'and billing clearance ' : '') +
                        'before confirming room departure.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-large"
                    disabled={!canConfirmDeparture || isProcessing}
                    onClick={() => confirmRoomDeparture(caseData.id)}
                  >
                    <LogOut className="btn-icon" />
                    <span>Confirm Room Departure & Start Housekeeping</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* STEP 3: Housekeeping Cleaning & Photo Capture */}
          <section className="step-card" aria-labelledby="step-cleaning-title">
            <div className="step-card-header">
              <div className="step-num-bubble">3</div>
              <div>
                <h3 id="step-cleaning-title" className="step-title">
                  Housekeeping Terminal Sanitisation
                </h3>
                <p className="step-description">
                  Perform bed sanitisation, replace terminal linens, and capture verification photo.
                </p>
              </div>
            </div>

            {!caseData.departureConfirmed ? (
              <div className="step-locked-box">
                <Clock className="locked-icon" />
                <span>Awaiting room departure confirmation before housekeeping can begin.</span>
              </div>
            ) : (
              <div className="cleaning-content">
                {/* Cleaning state */}
                {!caseData.cleaningStarted ? (
                  <div className="start-cleaning-prompt">
                    <p>Housekeeping team has arrived at the room.</p>
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

                {/* Privacy Reminder Banner (Mandatory requirement) */}
                <div className="privacy-camera-warning" role="alert">
                  <div className="warning-icon-wrapper">
                    <AlertTriangle className="warning-icon" />
                  </div>
                  <div className="warning-body">
                    <strong className="warning-title">Privacy & Compliance Safeguard Reminder</strong>
                    <p className="warning-text">
                      Frame <strong>ONLY the sanitised bed and immediate room environment</strong>.
                      Do NOT capture people (patients, nurses, visitors), clinical monitors,
                      ABHA numbers, paper case sheets, bed tags, or identifiable healthcare documents.
                    </p>
                  </div>
                </div>

                {/* Rejection notice if previously rejected */}
                {caseData.status === 'REJECTED_RECLEAN' && (
                  <div className="rejection-alert-card" role="alert">
                    <div className="rej-badge">RE-CLEAN REQUIRED</div>
                    <p className="rej-reason">
                      <strong>Coordinator note:</strong> {caseData.rejectionReason}
                    </p>
                    {caseData.rejectionDetails && (
                      <p className="rej-details">"{caseData.rejectionDetails}"</p>
                    )}
                    <p className="rej-action-hint">
                      The previous image was deleted. Please address the issue, re-clean, and upload a replacement photo.
                    </p>
                  </div>
                )}

                {/* Photo Upload / Camera Controls */}
                <div className="photo-upload-zone">
                  <input
                    key={fileInputKey}
                    id="camera-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    className="visually-hidden"
                    onChange={handleFileUpload}
                    disabled={isProcessing || caseData.status === 'BED_READY'}
                  />

                  <div className="upload-buttons-row">
                    <label
                      htmlFor="camera-file-input"
                      className={`btn btn-primary ${
                        caseData.status === 'BED_READY' || isProcessing ? 'disabled' : ''
                      }`}
                    >
                      <Camera className="btn-icon" />
                      <span>
                        {caseData.photoUploaded
                          ? 'Upload Replacement Photo'
                          : 'Capture / Upload Bed Photo'}
                      </span>
                    </label>

                    {/* Synthetic Photo Shortcut for Easy Desktop Demo Walkthrough */}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleUseSyntheticPhoto}
                      disabled={isProcessing || caseData.status === 'BED_READY'}
                      title="Generate clean synthetic hospital bed SVG blob directly into IndexedDB"
                    >
                      <Layers className="btn-icon" />
                      <span>Use Synthetic Room Photo (Demo)</span>
                    </button>
                  </div>

                  <span className="file-limits-caption">
                    Accepts JPEG, PNG, or WebP • Max 10MB • Stored locally in IndexedDB only
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Coordinator Review Panel & Event History */}
        <div className="review-and-history-column">
          {/* STEP 4 & 5: Coordinator Photo Review Card */}
          <section className="review-card" aria-labelledby="review-card-title">
            <div className="review-card-header">
              <div className="header-title-group">
                <Eye className="review-header-icon" />
                <h3 id="review-card-title" className="review-title">
                  Coordinator Photo Review
                </h3>
              </div>

              {caseData.photoExpiresAt && !caseData.photoPurged && (
                <div
                  className="retention-countdown-pill"
                  title="Photo deletion countdown"
                >
                  <Clock className="clock-icon" />
                  <span>{formatExpiryTime(caseData.photoExpiresAt)}</span>
                </div>
              )}
            </div>

            {/* Photo Preview Container */}
            <div className="photo-preview-viewport">
              {photoLoading && (
                <div className="photo-state-box loading">
                  <div className="spinner" />
                  <span>Loading photo from IndexedDB...</span>
                </div>
              )}

              {photoLoadError && (
                <div className="photo-state-box error">
                  <AlertTriangle className="state-icon red" />
                  <span className="error-title">Storage Retrieval Error</span>
                  <p>{photoLoadError}</p>
                </div>
              )}

              {caseData.photoPurged && (
                <div className="photo-state-box purged" role="status">
                  <Trash2 className="state-icon muted" />
                  <span className="purged-title">Photo Permanently Purged</span>
                  <p className="purged-desc">
                    Photo blob deleted from local IndexedDB per the 48-hour retention policy.
                  </p>
                  <div className="purged-audit-pill">
                    ✓ Bed readiness approval audit record preserved below
                  </div>
                </div>
              )}

              {!photoLoading && !photoLoadError && !caseData.photoPurged && photoObjectUrl && (
                <div className="photo-image-frame">
                  <img
                    src={photoObjectUrl}
                    alt={`Operational room inspection photo for case ${caseData.caseRef}, bed ${caseData.bed}`}
                    className="preview-img"
                  />
                  <div className="photo-metadata-overlay">
                    <span className="photo-time">
                      Captured:{' '}
                      {caseData.photoUploadedAt
                        ? new Date(caseData.photoUploadedAt).toLocaleString()
                        : 'Recent'}
                    </span>
                    <span className="photo-storage-tag">IndexedDB Local Storage</span>
                  </div>
                </div>
              )}

              {!photoLoading &&
                !photoLoadError &&
                !caseData.photoPurged &&
                !photoObjectUrl &&
                !caseData.photoUploaded && (
                  <div className="photo-state-box empty">
                    <Camera className="state-icon muted" />
                    <span className="empty-title">No Bed Photo Uploaded</span>
                    <p>
                      Housekeeping will take a photo of the freshly sanitised bed once cleaning is
                      complete.
                    </p>
                  </div>
                )}
            </div>

            {/* Coordinator Actions */}
            <div className="coordinator-action-dock">
              {caseData.status === 'AWAITING_REVIEW' && (
                <div className="review-actions-split">
                  <button
                    type="button"
                    className="btn btn-teal-action"
                    onClick={() => approveBedReady(caseData.id)}
                    disabled={isProcessing || !caseData.photoUploaded}
                    aria-label="Approve bed ready for patient admission"
                  >
                    <CheckCircle2 className="btn-icon" />
                    <span>Approve Bed Ready</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => setIsRejectionModalOpen(true)}
                    disabled={isProcessing}
                    aria-label="Request re-clean and delete photo"
                  >
                    <AlertTriangle className="btn-icon" />
                    <span>Request Re-clean / New Photo</span>
                  </button>
                </div>
              )}

              {caseData.status === 'BED_READY' && (
                <div className="bed-ready-summary-box">
                  <div className="approved-seal">
                    <ShieldCheck className="seal-icon" />
                    <div>
                      <strong>Bed Verified & Approved</strong>
                      <p>
                        Approved by {caseData.approverLabel || 'Coordinator (Simulated)'} at{' '}
                        {caseData.approvedAt
                          ? new Date(caseData.approvedAt).toLocaleString()
                          : 'Recorded'}
                      </p>
                    </div>
                  </div>

                  {/* Demo-only purge control */}
                  {!caseData.photoPurged && (
                    <div className="demo-retention-test-box">
                      <span className="demo-label">DEMO RETENTION CONTROL</span>
                      <p className="demo-desc">
                        Simulate the 48-hour retention expiry immediately without waiting 2 days.
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => purgePhotoNow(caseData.id)}
                        disabled={isProcessing}
                        aria-label="Delete photo now for retention review"
                      >
                        <Trash2 className="btn-icon" />
                        <span>Delete Photo Now (Demo Control)</span>
                      </button>
                    </div>
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
                Operational Event History
              </h3>
              <span className="audit-tag">Local Audit Trail</span>
            </div>

            <p className="audit-privacy-notice">
              * Privacy boundary: Event log stores operational timestamps and approver notices only.
              Image binaries, URLs, and file names are never stored in audit logs.
            </p>

            <div className="history-timeline">
              {caseData.events.map((evt) => {
                const isApproval = evt.type === 'APPROVAL_NOTICE';
                const isPurge = evt.type === 'PHOTO_PURGED' || evt.type === 'PHOTO_EXPIRED';
                const isRejection = evt.type === 'REJECTION_NOTICE';

                return (
                  <div
                    key={evt.id}
                    className={`timeline-entry ${
                      isApproval ? 'entry-approval' : isPurge ? 'entry-purge' : isRejection ? 'entry-rejection' : ''
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

      {/* Rejection Reason Modal */}
      <RejectionModal
        isOpen={isRejectionModalOpen}
        caseRef={caseData.caseRef}
        onClose={() => setIsRejectionModalOpen(false)}
        onConfirm={async (reason, details) => {
          await rejectBedPhoto(caseData.id, reason, details);
          setIsRejectionModalOpen(false);
        }}
        isProcessing={isProcessing}
      />
    </div>
  );
};
