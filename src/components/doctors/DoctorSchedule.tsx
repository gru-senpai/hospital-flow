import React, { useState } from 'react';
import {
  AlertTriangle,
  Filter,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import type { DoctorDutyStatus } from '../../types';

export const DoctorSchedule: React.FC = () => {
  const { doctors, updateDoctorStatus } = useOperations();

  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const departments = ['ALL', 'Emergency & Trauma', 'Cardiology', 'Intensive Care (ICU)', 'Orthopedics', 'Anesthesia', 'Ward 4B (Stepdown)'];
  const shifts = ['ALL', 'MORNING', 'EVENING', 'NIGHT'];

  const filteredDoctors = doctors.filter((doc) => {
    if (departmentFilter !== 'ALL' && doc.department !== departmentFilter) return false;
    if (shiftFilter !== 'ALL' && doc.shift !== shiftFilter) return false;
    return true;
  });

  // Department Coverage Gap Detection
  const coverageGaps = [
    { department: 'Anesthesia', shift: 'NIGHT (23:00 - 07:00)', gap: '1 Doctor Required (Zero Scheduled)', severity: 'CRITICAL' },
    { department: 'Cardiology', shift: 'EVENING (15:00 - 23:00)', gap: 'Cath lab interventional backup needed', severity: 'WARNING' },
  ];

  const handleStatusChange = (doctorId: string, nextStatus: DoctorDutyStatus) => {
    updateDoctorStatus(doctorId, nextStatus);
  };

  return (
    <div className="doctors-workspace-page">
      {/* Coverage Gap Warning Banner */}
      {coverageGaps.length > 0 && (
        <div className="coverage-gaps-card">
          <div className="gaps-header">
            <AlertTriangle size={18} className="text-amber" />
            <h4>Active Roster Shortfall & Uncovered Shift Warnings</h4>
          </div>
          <div className="gaps-items-list">
            {coverageGaps.map((gap, i) => (
              <div key={i} className={`gap-alert-item ${gap.severity.toLowerCase()}`}>
                <span className="gap-dept-pill">{gap.department}</span>
                <span className="gap-shift">{gap.shift}:</span>
                <span className="gap-desc">{gap.gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar Controls */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-filter-box">
            <Calendar size={15} className="text-slate" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="toolbar-date-input"
            />
          </div>

          <div className="toolbar-filter-box">
            <Filter size={15} className="text-slate" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by department"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Clinical Specialties' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-filter-box">
            <Clock size={15} className="text-slate" />
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by shift"
            >
              {shifts.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Shift Windows' : `${s} SHIFT`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <span className="roster-verified-pill">
            <ShieldCheck size={13} /> Official Roster Source of Truth
          </span>
        </div>
      </div>

      {/* Doctor Roster Table */}
      <div className="ops-card">
        <div className="ops-card-header">
          <div>
            <h3>Medical Staffing Schedule & Roster Fulfillments</h3>
            <p className="section-desc">
              Operational duty records. Presence is confirmed via department station check-in.
            </p>
          </div>
          <span className="badge-count-pill">{filteredDoctors.length} Clinicians Listed</span>
        </div>

        <div className="table-responsive">
          <table className="enterprise-data-table">
            <thead>
              <tr>
                <th>Current Status</th>
                <th>Doctor & Qualification</th>
                <th>Clinical Specialty</th>
                <th>Department</th>
                <th>Shift Window</th>
                <th>Station / Room</th>
                <th>Intercom</th>
                <th className="text-right">Duty Status Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doc) => {
                const isOnDuty = doc.status === 'ON_DUTY';
                const isInSurgery = doc.status === 'IN_SURGERY';
                const isOnCall = doc.status === 'ON_CALL';

                return (
                  <tr key={doc.id}>
                    <td>
                      <StatusBadge
                        label={doc.status.replace(/_/g, ' ')}
                        tone={
                          isOnDuty
                            ? 'green'
                            : isInSurgery
                            ? 'purple'
                            : isOnCall
                            ? 'blue'
                            : 'slate'
                        }
                        size="sm"
                      />
                    </td>
                    <td>
                      <strong className="table-cell-title">{doc.doctorName}</strong>
                      <span className="table-cell-subtitle">{doc.id}</span>
                    </td>
                    <td>{doc.specialty}</td>
                    <td>
                      <span className="dept-tag">{doc.department}</span>
                    </td>
                    <td>
                      <div className="shift-time-box">
                        <span className="shift-label">{doc.shift}</span>
                        <span className="shift-hours">{doc.shiftHours}</span>
                      </div>
                    </td>
                    <td>
                      <span className="location-pill">
                        <MapPin size={12} /> {doc.locationRoom}
                      </span>
                    </td>
                    <td>
                      <span className="intercom-tag">
                        <Phone size={12} /> {doc.intercomExt}
                      </span>
                    </td>
                    <td className="text-right">
                      <select
                        value={doc.status}
                        onChange={(e) => handleStatusChange(doc.id, e.target.value as DoctorDutyStatus)}
                        className="status-dropdown-select"
                        aria-label={`Update duty status for ${doc.doctorName}`}
                      >
                        <option value="ON_DUTY">On Duty</option>
                        <option value="IN_SURGERY">In Surgery</option>
                        <option value="ON_CALL">On Call</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="OFF_DUTY">Off Duty</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
