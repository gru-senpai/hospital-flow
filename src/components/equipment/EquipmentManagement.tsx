import React, { useState } from 'react';
import {
  Wrench,
  Activity,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Filter,
  X,
  PowerOff,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';

export const EquipmentManagement: React.FC = () => {
  const { equipment, bookEquipment, reportEquipmentOutage, restoreEquipment } = useOperations();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedEqId, setSelectedEqId] = useState(equipment[0]?.id || '');
  const [bookingWard, setBookingWard] = useState('Ward 4B (Stepdown)');
  const [bookingUser, setBookingUser] = useState('Charge Nurse');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingHours, setBookingHours] = useState(12);
  const [bookingPurpose, setBookingPurpose] = useState('Post-operative respiratory monitoring');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Outage Modal State
  const [isOutageModalOpen, setIsOutageModalOpen] = useState(false);
  const [outageEqId, setOutageEqId] = useState('');
  const [outageReason, setOutageReason] = useState('');

  const filteredEquipment = equipment.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  const categories: { label: string; value: string }[] = [
    { label: 'All Equipment Categories', value: 'ALL' },
    { label: 'Life Support', value: 'LIFE_SUPPORT' },
    { label: 'Patient Monitoring', value: 'PATIENT_MONITORING' },
    { label: 'Infusion Therapy', value: 'INFUSION_THERAPY' },
    { label: 'Diagnostic Ultrasound/ECG', value: 'DIAGNOSTIC' },
    { label: 'Surgical Imaging', value: 'SURGICAL' },
  ];

  const statuses = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Operational', value: 'OPERATIONAL' },
    { label: 'In Use', value: 'IN_USE' },
    { label: 'Maintenance Due', value: 'MAINTENANCE_DUE' },
    { label: 'Out of Service', value: 'OUT_OF_SERVICE' },
  ];

  const handleOpenBookingModal = (eqId?: string) => {
    if (eqId) setSelectedEqId(eqId);
    setBookingError(null);
    setBookingSuccess(null);
    setIsBookingModalOpen(true);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    const item = equipment.find((eq) => eq.id === selectedEqId);
    if (!item) {
      setBookingError('Please select valid equipment.');
      return;
    }

    const res = bookEquipment({
      equipmentId: item.id,
      equipmentName: item.name,
      requestingWard: bookingWard,
      reservedBy: bookingUser,
      date: bookingDate,
      startTime: bookingTime,
      hours: bookingHours,
      purpose: bookingPurpose,
    });

    if (!res.success) {
      setBookingError(res.error || 'Failed to book equipment.');
      return;
    }

    setBookingSuccess(`Equipment ${item.id} successfully reserved for ${bookingWard}.`);
    setTimeout(() => {
      setIsBookingModalOpen(false);
      setBookingSuccess(null);
    }, 1200);
  };

  const handleOpenOutageModal = (eqId: string) => {
    setOutageEqId(eqId);
    setOutageReason('Sensor calibration drift reported by floor tech');
    setIsOutageModalOpen(true);
  };

  const handleSubmitOutage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outageReason.trim()) return;
    reportEquipmentOutage(outageEqId, outageReason.trim());
    setIsOutageModalOpen(false);
  };

  return (
    <div className="equipment-workspace-page">
      {/* Filters & Actions Bar */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-filter-box">
            <Filter size={15} className="text-slate" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by category"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by status"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenBookingModal()}
          >
            <PlusCircle size={16} />
            <span>+ Book Shared Equipment</span>
          </button>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="equipment-grid">
        {filteredEquipment.map((eq) => {
          const isAvailable = eq.status === 'OPERATIONAL';
          const isUnderMaintenance = eq.status === 'MAINTENANCE_DUE' || eq.status === 'OUT_OF_SERVICE';

          return (
            <div key={eq.id} className={`equipment-card status-${eq.status.toLowerCase()}`}>
              <div className="eq-card-header">
                <div className="eq-id-badge">
                  <Wrench size={15} />
                  <span>{eq.id}</span>
                </div>
                <StatusBadge
                  label={eq.status.replace('_', ' ')}
                  tone={
                    eq.status === 'OPERATIONAL'
                      ? 'green'
                      : eq.status === 'IN_USE'
                      ? 'blue'
                      : eq.status === 'MAINTENANCE_DUE'
                      ? 'amber'
                      : 'red'
                  }
                />
              </div>

              <h4 className="eq-title">{eq.name}</h4>
              <span className="eq-category-tag">{eq.category.replace('_', ' ')} • Model: {eq.model}</span>
              <span className="eq-location">Location: <strong>{eq.currentWard}</strong></span>

              {/* Utilization Bar */}
              <div className="eq-utilization-wrap">
                <div className="eq-util-labels">
                  <span>Duty Utilization</span>
                  <strong>{eq.utilizationPercent}%</strong>
                </div>
                <div className="eq-util-track">
                  <div
                    className={`eq-util-bar ${eq.utilizationPercent > 80 ? 'high' : 'normal'}`}
                    style={{ width: `${eq.utilizationPercent}%` }}
                  />
                </div>
              </div>

              {/* Telemetry info */}
              <div className="eq-telemetry-box">
                <Activity size={14} className="text-teal" />
                <span className="eq-telemetry-text">{eq.lastTelemetryTimestamp}</span>
              </div>

              {eq.blockerReason && (
                <div className="eq-blocker-note">
                  <AlertTriangle size={14} />
                  <span>{eq.blockerReason}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="eq-card-actions">
                {isAvailable && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm flex-1"
                    onClick={() => handleOpenBookingModal(eq.id)}
                  >
                    <span>Reserve Asset</span>
                  </button>
                )}

                {eq.status === 'IN_USE' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => handleOpenOutageModal(eq.id)}
                  >
                    <span>Report Issue</span>
                  </button>
                )}

                {isUnderMaintenance ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex-1 text-emerald"
                    onClick={() => restoreEquipment(eq.id)}
                  >
                    <RotateCcw size={14} />
                    <span>Restore Availability</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-red"
                    onClick={() => handleOpenOutageModal(eq.id)}
                    title="Log maintenance outage"
                  >
                    <PowerOff size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsBookingModalOpen(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Wrench size={20} className="text-emerald" />
                <h3>Book Hospital Equipment</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsBookingModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Equipment Asset</label>
                <select
                  value={selectedEqId}
                  onChange={(e) => setSelectedEqId(e.target.value)}
                  className="form-control"
                  required
                >
                  {equipment.map((eq) => {
                    const disabled = eq.status === 'OUT_OF_SERVICE' || eq.status === 'MAINTENANCE_DUE';
                    return (
                      <option key={eq.id} value={eq.id} disabled={disabled}>
                        {eq.id} — {eq.name} ({eq.currentWard}) {disabled ? `[BLOCKED: ${eq.status}]` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Requesting Ward</label>
                  <select
                    value={bookingWard}
                    onChange={(e) => setBookingWard(e.target.value)}
                    className="form-control"
                  >
                    <option value="Ward 4B (Stepdown)">Ward 4B (Stepdown)</option>
                    <option value="ICU Ward 5A">ICU Ward 5A</option>
                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                    <option value="Operation Theatre 1">Operation Theatre 1</option>
                    <option value="Dialysis Day Care">Dialysis Day Care</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Authorized Staff Role</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bookingUser}
                    onChange={(e) => setBookingUser(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Reservation Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Hours)</label>
                  <select
                    value={bookingHours}
                    onChange={(e) => setBookingHours(Number(e.target.value))}
                    className="form-control"
                  >
                    <option value={4}>4 Hours</option>
                    <option value={8}>8 Hours</option>
                    <option value={12}>12 Hours (Half shift)</option>
                    <option value={24}>24 Hours (Full day)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical / Operational Justification</label>
                <input
                  type="text"
                  className="form-control"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  required
                />
              </div>

              {bookingError && (
                <div className="inline-alert alert-error" role="alert">
                  <AlertTriangle size={18} />
                  <span>{bookingError}</span>
                </div>
              )}

              {bookingSuccess && (
                <div className="inline-alert alert-success" role="status">
                  <CheckCircle2 size={18} />
                  <span>{bookingSuccess}</span>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsBookingModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Equipment Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outage Reporting Modal */}
      {isOutageModalOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsOutageModalOpen(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <AlertTriangle size={20} className="text-red" />
                <h3>Report Equipment Outage / Maintenance</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsOutageModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitOutage} className="modal-form">
              <p className="form-hint">
                Declaring <strong>{outageEqId}</strong> out of service immediately marks the asset unbookable and generates an operational alert for Biomedical Engineering.
              </p>

              <div className="form-group">
                <label className="form-label">Fault / Outage Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={outageReason}
                  onChange={(e) => setOutageReason(e.target.value)}
                  required
                  placeholder="e.g. Oxygen flow sensor failure during pre-use self check; scheduled calibration required"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsOutageModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Confirm Equipment Outage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
