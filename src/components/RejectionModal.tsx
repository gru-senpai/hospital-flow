import React, { useState } from 'react';
import type { RejectionReasonCategory } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  caseRef: string;
  onClose: () => void;
  onConfirm: (reason: RejectionReasonCategory, details?: string) => void;
  isProcessing: boolean;
}

const REASONS: { category: RejectionReasonCategory; label: string; desc: string }[] = [
  {
    category: 'LINEN_UNMADE',
    label: 'Linen unmade, wrinkled or stained',
    desc: 'Bedsheet, pillow cover, or duvet not fresh, stained, or improperly fitted.',
  },
  {
    category: 'SURFACE_UNCLEAN',
    label: 'Surface / floor uncleanness or spills',
    desc: 'Visible dust, fluid, or residue on bedside locker, floor, or side rails.',
  },
  {
    category: 'TRASH_REMAINS',
    label: 'Discarded items / PPE present in room',
    desc: 'Used gloves, masks, packaging, or disposable items not removed.',
  },
  {
    category: 'PRIVACY_ISSUE_DETECTED',
    label: 'Privacy violation: Person, document, or monitor visible',
    desc: 'Image captures identifiable staff, patient, bed card, ABHA ID, or screen.',
  },
  {
    category: 'BLURRY_OR_IMPROPER_ANGLE',
    label: 'Photo blurry, poorly lit, or inadequate angle',
    desc: 'Cannot inspect bed corners, headboard, or cleanliness due to image quality.',
  },
  {
    category: 'OTHER_OPERATIONAL',
    label: 'Other operational deficit',
    desc: 'Any other deficiency requiring housekeeping re-attendance.',
  },
];

export const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  caseRef,
  onClose,
  onConfirm,
  isProcessing,
}) => {
  const [selectedReason, setSelectedReason] = useState<RejectionReasonCategory>('LINEN_UNMADE');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedReason, details.trim() || undefined);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rej-title">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="icon-badge-danger">
              <AlertTriangle className="modal-icon" />
            </div>
            <div>
              <h3 id="rej-title" className="modal-title">
                Request Re-clean / New Photo
              </h3>
              <p className="modal-subtitle">Case: {caseRef}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="privacy-deletion-alert" role="alert">
            <Trash2 className="alert-icon" />
            <div className="alert-text">
              <strong>Mandatory Storage Deletion:</strong>
              <p>
                Confirming rejection will <strong>immediately delete the current photo</strong> from
                local IndexedDB storage. Housekeeping must re-clean and upload a fresh replacement photo.
              </p>
            </div>
          </div>

          <fieldset className="form-fieldset">
            <legend className="fieldset-legend">Select Rejection Reason Category *</legend>
            <div className="reason-options-list">
              {REASONS.map((r) => (
                <label
                  key={r.category}
                  className={`reason-option-card ${
                    selectedReason === r.category ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={r.category}
                    checked={selectedReason === r.category}
                    onChange={() => setSelectedReason(r.category)}
                    className="radio-input"
                  />
                  <div className="reason-content">
                    <span className="reason-title">{r.label}</span>
                    <span className="reason-desc">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-group">
            <label htmlFor="rej-notes" className="form-label">
              Operational Note for Housekeeping (Optional)
            </label>
            <textarea
              id="rej-notes"
              className="form-textarea"
              rows={2}
              placeholder="e.g. Please re-check right corner bed rail and replace pillow sham."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isProcessing}
            >
              <Trash2 className="btn-icon" />
              <span>{isProcessing ? 'Deleting Photo...' : 'Confirm Rejection & Delete Photo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
