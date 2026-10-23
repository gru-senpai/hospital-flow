import React, { useState } from 'react';
import {
  Stethoscope,
  MapPin,
  Calendar,
  Users,
  PackageCheck,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';

export const HealthCampManagement: React.FC = () => {
  const { camps, allocateCampResources } = useOperations();

  const [selectedCampId, setSelectedCampId] = useState(camps[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resourceCategory, setResourceCategory] = useState<'CARE_KITS' | 'SCREENING_KITS' | 'STAFF_SHIFTS' | 'TRANSPORT_UNITS' | 'MEDICINE_SUPPLIES'>('CARE_KITS');
  const [resourceName, setResourceName] = useState('Pediatric Nutrition & Vitals Screening Kit');
  const [units, setUnits] = useState(15);
  const [allocatingDept, setAllocatingDept] = useState('Outreach Pediatrics');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const activeCamp = camps.find((c) => c.id === selectedCampId) || camps[0];

  const remainingUnits = activeCamp ? Math.max(0, activeCamp.capacityUnits - activeCamp.allocatedUnits) : 0;
  const percentAllocated = activeCamp ? Math.round((activeCamp.allocatedUnits / activeCamp.capacityUnits) * 100) : 0;
  const isNearCapacity = percentAllocated >= (activeCamp?.warningThresholdPercent || 80);

  const handleOpenModal = () => {
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!activeCamp) return;

    const res = allocateCampResources(activeCamp.id, {
      resourceCategory,
      resourceName,
      units,
      allocatingDepartment: allocatingDept,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to allocate resources.');
      return;
    }

    setFormSuccess(`Successfully allocated ${units} units of ${resourceName}.`);
    setTimeout(() => {
      setIsModalOpen(false);
      setFormSuccess(null);
    }, 1200);
  };

  return (
    <div className="camps-workspace-page">
      {/* Camp Selector & Header Overview */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="camp-selector-pill">
            <Stethoscope size={16} className="text-teal" />
            <select
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="toolbar-select font-semibold"
              aria-label="Select community outreach camp"
            >
              {camps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name} ({camp.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenModal}
            disabled={remainingUnits <= 0}
          >
            <PlusCircle size={16} />
            <span>+ Allocate Field Resources</span>
          </button>
        </div>
      </div>

      {activeCamp && (
        <>
          {/* Main Camp Capacity Dashboard Panel */}
          <div className="ops-card mb-4">
            <div className="ops-card-header">
              <div>
                <div className="camp-title-row">
                  <h3>{activeCamp.name}</h3>
                  <StatusBadge
                    label={activeCamp.status}
                    tone={activeCamp.status === 'ACTIVE' ? 'green' : 'amber'}
                  />
                </div>
                <div className="camp-metadata-row">
                  <span><MapPin size={14} /> {activeCamp.location}</span>
                  <span>•</span>
                  <span><Calendar size={14} /> {activeCamp.startDate} to {activeCamp.endDate}</span>
                  <span>•</span>
                  <span><Users size={14} /> Lead: {activeCamp.coordinatorName}</span>
                </div>
              </div>

              <div className="capacity-number-stats">
                <div className="num-stat">
                  <span className="num-val text-navy">{activeCamp.allocatedUnits}</span>
                  <span className="num-label">Allocated</span>
                </div>
                <div className="num-divider">/</div>
                <div className="num-stat">
                  <span className="num-val text-slate">{activeCamp.capacityUnits}</span>
                  <span className="num-label">Total Cap</span>
                </div>
                <div className="num-divider">=</div>
                <div className="num-stat">
                  <span className={`num-val ${remainingUnits < 20 ? 'text-red' : 'text-emerald'}`}>
                    {remainingUnits}
                  </span>
                  <span className="num-label">Remaining</span>
                </div>
              </div>
            </div>

            {/* Progress Meter with warning threshold marker */}
            <div className="camp-progress-section">
              <div className="progress-labels-row">
                <span>Resource Quota Fulfillment</span>
                <span className={isNearCapacity ? 'text-amber font-semibold' : ''}>
                  {percentAllocated}% Allocated {isNearCapacity ? '(Warning Threshold Reached)' : ''}
                </span>
              </div>
              <div className="camp-track-bar">
                <div
                  className={`camp-progress-fill ${isNearCapacity ? 'near-capacity' : 'normal'}`}
                  style={{ width: `${Math.min(100, percentAllocated)}%` }}
                />
              </div>
            </div>

            {isNearCapacity && (
              <div className="inline-alert alert-warning mt-3">
                <AlertTriangle size={18} />
                <span>
                  Allocation capacity warning: {remainingUnits} units remaining. New allocations will be
                  automatically rejected once the 100% boundary is reached.
                </span>
              </div>
            )}
          </div>

          {/* Allocation Breakdown Log */}
          <div className="ops-card">
            <div className="ops-card-header">
              <div>
                <h3>Resource Allocation Log</h3>
                <p className="section-desc">
                  Active deployment of care kits, staff shifts, screening units, and sample logistics.
                </p>
              </div>
              <span className="badge-count-pill">{activeCamp.allocations.length} Allocations</span>
            </div>

            <div className="table-responsive">
              <table className="enterprise-data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Resource Specification</th>
                    <th>Allocated Units</th>
                    <th>Allocating Dept</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCamp.allocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-table-cell">
                        No resources have been allocated to this outreach camp yet.
                      </td>
                    </tr>
                  ) : (
                    activeCamp.allocations.map((alc) => (
                      <tr key={alc.id}>
                        <td>
                          <span className="resource-cat-pill">
                            {alc.resourceCategory.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <strong>{alc.resourceName}</strong>
                        </td>
                        <td>
                          <span className="units-count-tag">{alc.units} units</span>
                        </td>
                        <td>{alc.allocatingDepartment}</td>
                        <td>{alc.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Allocation Modal */}
      {isModalOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <PackageCheck size={20} className="text-teal" />
                <h3>Allocate Resources to Health Camp</h3>
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

            <form onSubmit={handleAllocate} className="modal-form">
              <p className="form-hint">
                Remaining Camp Capacity: <strong>{remainingUnits} units</strong>. Allocations exceeding this limit are prohibited.
              </p>

              <div className="form-group">
                <label className="form-label">Resource Category</label>
                <select
                  value={resourceCategory}
                  onChange={(e) => setResourceCategory(e.target.value as any)}
                  className="form-control"
                >
                  <option value="CARE_KITS">Care & Hygiene Kits</option>
                  <option value="SCREENING_KITS">Diagnostic / Screening Kits</option>
                  <option value="STAFF_SHIFTS">Medical / Nursing Staff Shifts</option>
                  <option value="TRANSPORT_UNITS">Cold Chain & Mobile Transit</option>
                  <option value="MEDICINE_SUPPLIES">Essential Outreach Medicines</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Resource Name / Description</label>
                <input
                  type="text"
                  className="form-control"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Number of Units</label>
                  <input
                    type="number"
                    min={1}
                    max={remainingUnits}
                    className="form-control"
                    value={units}
                    onChange={(e) => setUnits(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Allocating Department</label>
                  <input
                    type="text"
                    className="form-control"
                    value={allocatingDept}
                    onChange={(e) => setAllocatingDept(e.target.value)}
                    required
                  />
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
                <button type="submit" className="btn btn-primary" disabled={remainingUnits <= 0}>
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
