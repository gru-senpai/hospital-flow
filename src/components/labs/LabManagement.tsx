import React, { useState } from 'react';
import {
  FlaskConical,
  Calendar,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Filter,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';

export const LabManagement: React.FC = () => {
  const { labs, labReservations, createLabReservation, cancelLabReservation } = useOperations();

  const [activeTab, setActiveTab] = useState<'schedule' | 'instruments'>('schedule');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInstrumentId, setModalInstrumentId] = useState(labs[0]?.id || '');
  const [modalTestType, setModalTestType] = useState('Comprehensive Metabolic Panel (CMP)');
  const [modalDepartment, setModalDepartment] = useState('Emergency & Trauma');
  const [modalDate, setModalDate] = useState(new Date().toISOString().slice(0, 10));
  const [modalStartTime, setModalStartTime] = useState('14:00');
  const [modalDuration, setModalDuration] = useState(60);
  const [modalPriority, setModalPriority] = useState<'ROUTINE' | 'STAT_URGENT' | 'HIGH'>('ROUTINE');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filtered reservations
  const filteredReservations = labReservations.filter((res) => {
    if (selectedDeptFilter !== 'ALL' && res.requestingDepartment !== selectedDeptFilter) return false;
    return true;
  });

  const departments = ['ALL', 'Emergency & Trauma', 'Ward 4B (Stepdown)', 'ICU Ward 5A', 'Operation Theatre', 'Cardiology'];

  const handleOpenModal = (instrumentId?: string) => {
    if (instrumentId) setModalInstrumentId(instrumentId);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const instrument = labs.find((l) => l.id === modalInstrumentId);
    if (!instrument) {
      setFormError('Please select a valid diagnostic instrument.');
      return;
    }

    // Calculate end time
    const [startH, startM] = modalStartTime.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + modalDuration;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const res = createLabReservation({
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      testType: modalTestType,
      requestingDepartment: modalDepartment,
      date: modalDate,
      startTime: modalStartTime,
      endTime,
      durationMinutes: modalDuration,
      priority: modalPriority,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create booking.');
      return;
    }

    setFormSuccess(`Reservation confirmed for ${instrument.name} (${modalStartTime} - ${endTime})`);
    setTimeout(() => {
      setIsModalOpen(false);
      setFormSuccess(null);
    }, 1200);
  };

  return (
    <div className="lab-workspace-page">
      {/* Top Filter and Actions Toolbar */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-tab-group">
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'schedule' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <Calendar size={16} />
              <span>Diagnostic Schedule ({filteredReservations.length})</span>
            </button>
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'instruments' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('instruments')}
            >
              <Layers size={16} />
              <span>Analyzers & Instruments ({labs.length})</span>
            </button>
          </div>

          <div className="toolbar-filter-box">
            <Filter size={15} className="text-slate" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by department"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'All Requesting Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenModal()}
          >
            <PlusCircle size={16} />
            <span>+ Reserve Lab Analyzer</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Diagnostic Schedule View */}
      {activeTab === 'schedule' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Upcoming Diagnostic Instrument Reservations</h3>
              <p className="section-desc">
                Guaranteed time slots reserved across hospital departments. Overlapping reservations are automatically blocked.
              </p>
            </div>
            <span className="badge-count-pill">{filteredReservations.length} Active Slots</span>
          </div>

          <div className="table-responsive">
            <table className="enterprise-data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Instrument</th>
                  <th>Test Profile</th>
                  <th>Requesting Dept</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Priority</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      No scheduled lab bookings found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((res) => (
                    <tr key={res.id}>
                      <td>
                        <StatusBadge
                          label={res.status}
                          tone={
                            res.status === 'RUNNING'
                              ? 'blue'
                              : res.status === 'SCHEDULED'
                              ? 'teal'
                              : res.status === 'COMPLETED'
                              ? 'green'
                              : 'slate'
                          }
                          size="sm"
                        />
                      </td>
                      <td>
                        <strong className="table-cell-title">{res.instrumentName}</strong>
                        <span className="table-cell-subtitle">{res.instrumentId}</span>
                      </td>
                      <td>
                        <span className="font-medium text-navy">{res.testType}</span>
                      </td>
                      <td>
                        <span className="dept-tag">{res.requestingDepartment}</span>
                      </td>
                      <td>
                        <div className="time-window-box">
                          <span className="time-date">{res.date}</span>
                          <span className="time-range">{res.startTime} – {res.endTime}</span>
                        </div>
                      </td>
                      <td>{res.durationMinutes} mins</td>
                      <td>
                        <span className={`priority-tag priority-${res.priority.toLowerCase()}`}>
                          {res.priority.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-right">
                        {res.status === 'SCHEDULED' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-red"
                            onClick={() => cancelLabReservation(res.id)}
                            title="Cancel reservation"
                          >
                            Cancel
                          </button>
                        )}
                        {res.status === 'RUNNING' && (
                          <span className="live-processing-tag">Processing</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Analyzer & Instrument Inventory */}
      {activeTab === 'instruments' && (
        <div className="instrument-cards-grid">
          {labs.map((inst) => (
            <div key={inst.id} className="instrument-card">
              <div className="inst-card-top">
                <div className="inst-icon-box">
                  <FlaskConical size={20} />
                </div>
                <StatusBadge
                  label={inst.status}
                  tone={
                    inst.status === 'ONLINE'
                      ? 'green'
                      : inst.status === 'IN_USE'
                      ? 'blue'
                      : inst.status === 'CALIBRATING'
                      ? 'amber'
                      : 'red'
                  }
                />
              </div>

              <h4 className="inst-title">{inst.name}</h4>
              <span className="inst-dept">{inst.department} • {inst.labRoom}</span>

              {/* Utilization Gauge */}
              <div className="inst-util-box">
                <div className="util-labels">
                  <span>Current Utilization</span>
                  <strong>{inst.utilizationRate}%</strong>
                </div>
                <div className="util-track">
                  <div
                    className={`util-bar ${inst.utilizationRate > 85 ? 'high' : 'normal'}`}
                    style={{ width: `${inst.utilizationRate}%` }}
                  />
                </div>
              </div>

              <div className="inst-details-row">
                <div className="detail-col">
                  <span className="detail-label">Active Queue</span>
                  <span className="detail-val">{inst.currentBatchQueue} batches</span>
                </div>
                <div className="detail-col">
                  <span className="detail-label">Last Calibrated</span>
                  <span className="detail-val">{inst.lastCalibratedAt}</span>
                </div>
              </div>

              <div className="inst-card-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm w-full"
                  onClick={() => handleOpenModal(inst.id)}
                  disabled={inst.status === 'MAINTENANCE'}
                >
                  <PlusCircle size={14} />
                  <span>Reserve Slot</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Creation Modal */}
      {isModalOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <FlaskConical size={20} className="text-teal" />
                <h3>Reserve Diagnostic Analyzer</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="modal-form">
              <div className="form-group">
                <label className="form-label">Diagnostic Instrument</label>
                <select
                  value={modalInstrumentId}
                  onChange={(e) => setModalInstrumentId(e.target.value)}
                  className="form-control"
                  required
                >
                  {labs.map((l) => (
                    <option key={l.id} value={l.id} disabled={l.status === 'MAINTENANCE'}>
                      {l.name} ({l.department}) {l.status === 'MAINTENANCE' ? '— OUT OF SERVICE' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Operational Test Profile</label>
                <input
                  type="text"
                  className="form-control"
                  value={modalTestType}
                  onChange={(e) => setModalTestType(e.target.value)}
                  required
                  placeholder="e.g. ABG Panel, Cardiac Troponin I, CBC Diff"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Requesting Department</label>
                  <select
                    value={modalDepartment}
                    onChange={(e) => setModalDepartment(e.target.value)}
                    className="form-control"
                  >
                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                    <option value="Ward 4B (Stepdown)">Ward 4B (Stepdown)</option>
                    <option value="ICU Ward 5A">ICU Ward 5A</option>
                    <option value="Operation Theatre">Operation Theatre</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dialysis Day Care">Dialysis Day Care</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Tier</label>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value as any)}
                    className="form-control"
                  >
                    <option value="ROUTINE">Routine Workup</option>
                    <option value="HIGH">High Priority</option>
                    <option value="STAT_URGENT">STAT / Acute Emergency</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Scheduled Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <select
                    value={modalDuration}
                    onChange={(e) => setModalDuration(Number(e.target.value))}
                    className="form-control"
                  >
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins (1 hr)</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins (2 hrs)</option>
                  </select>
                </div>
              </div>

              {formError && (
                <div className="inline-alert alert-error" role="alert">
                  <AlertTriangle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="inline-alert alert-success" role="status">
                  <CheckCircle2 size={18} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
