import React, { useState } from 'react';
import {
  Filter,
  Clock,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import type { StaffStatus } from '../../types';

export const StaffAvailability: React.FC = () => {
  const { staff, updateStaffStatus } = useOperations();

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');

  const departments = ['ALL', 'Emergency & Trauma', 'Intensive Care (ICU)', 'Ward 4B (Stepdown)', 'Facility Operations', 'Biochemistry Lab', 'Radiology'];
  const shifts = ['ALL', 'MORNING', 'EVENING', 'NIGHT'];

  // Department Coverage Aggregates
  const deptCoverage = [
    { department: 'Emergency & Trauma', planned: 12, available: 11, target: '100%' },
    { department: 'Intensive Care (ICU)', planned: 10, available: 9, target: '90%' },
    { department: 'Ward 4B (Stepdown)', planned: 8, available: 7, target: '88%' },
    { department: 'Facility Operations', planned: 6, available: 6, target: '100%' },
    { department: 'Diagnostic Labs', planned: 6, available: 5, target: '83%' },
  ];

  const filteredStaff = staff.filter((s) => {
    if (selectedDept !== 'ALL' && s.department !== selectedDept) return false;
    if (selectedShift !== 'ALL' && s.shift !== selectedShift) return false;
    return true;
  });

  const availableCount = staff.filter((s) => s.status === 'AVAILABLE' || s.status === 'ASSIGNED').length;
  const breakCount = staff.filter((s) => s.status === 'ON_BREAK').length;

  return (
    <div className="staff-workspace-page">
      {/* Department Coverage Fulfillment Bars */}
      <div className="ops-card mb-4">
        <div className="ops-card-header">
          <div>
            <h3>Departmental Shift Fulfillment & Staffing Ratios</h3>
            <p className="section-desc">
              Real-time nursing and paramedical coverage against minimum clinical nurse-to-patient safety standards.
            </p>
          </div>
          <span className="badge-count-pill">{availableCount} / {staff.length} Active Staff</span>
        </div>

        <div className="dept-coverage-bars-grid">
          {deptCoverage.map((dept) => {
            const pct = Math.round((dept.available / dept.planned) * 100);
            const isDeficit = pct < 85;

            return (
              <div key={dept.department} className="dept-coverage-card">
                <div className="coverage-card-top">
                  <strong>{dept.department}</strong>
                  <span className={`coverage-pct ${isDeficit ? 'text-amber' : 'text-emerald'}`}>
                    {dept.available}/{dept.planned} ({pct}%)
                  </span>
                </div>
                <div className="coverage-bar-track">
                  <div
                    className={`coverage-bar-fill ${isDeficit ? 'deficit' : 'fulfilled'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="coverage-card-bottom">
                  <span className="coverage-target-text">Safety Minimum: {dept.target}</span>
                  {isDeficit && <span className="coverage-warning-tag">Coverage Alert</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-filter-box">
            <Filter size={15} className="text-slate" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by department"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Hospital Departments' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-filter-box">
            <Clock size={15} className="text-slate" />
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
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
            {availableCount} Active Staff • {breakCount} on Break
          </span>
          <span className="roster-verified-pill">
            <ShieldCheck size={13} /> Strict Roster Verification
          </span>
        </div>
      </div>

      {/* Staff Members Table */}
      <div className="ops-card">
        <div className="table-responsive">
          <table className="enterprise-data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Staff Name</th>
                <th>Professional Role</th>
                <th>Department</th>
                <th>Assigned Station</th>
                <th>Shift Window</th>
                <th>Contact</th>
                <th className="text-right">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((person) => {
                const isAvail = person.status === 'AVAILABLE';
                const isAssigned = person.status === 'ASSIGNED';
                const onBreak = person.status === 'ON_BREAK';

                return (
                  <tr key={person.id}>
                    <td>
                      <StatusBadge
                        label={person.status.replace(/_/g, ' ')}
                        tone={
                          isAvail
                            ? 'green'
                            : isAssigned
                            ? 'blue'
                            : onBreak
                            ? 'amber'
                            : 'slate'
                        }
                        size="sm"
                      />
                    </td>
                    <td>
                      <strong className="table-cell-title">{person.name}</strong>
                      <span className="table-cell-subtitle">{person.id}</span>
                    </td>
                    <td>
                      <span className="font-medium text-navy">{person.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td>
                      <span className="dept-tag">{person.department}</span>
                    </td>
                    <td>
                      <span className="location-pill">{person.assignedArea}</span>
                    </td>
                    <td>
                      <span className="shift-label">{person.shift}</span>
                    </td>
                    <td>
                      <span className="intercom-tag">
                        <Phone size={12} /> {person.contactExt}
                      </span>
                    </td>
                    <td className="text-right">
                      <select
                        value={person.status}
                        onChange={(e) => updateStaffStatus(person.id, e.target.value as StaffStatus)}
                        className="status-dropdown-select"
                        aria-label={`Change status for ${person.name}`}
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="ON_BREAK">On Break</option>
                        <option value="IN_TRANSIT">In Transit</option>
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
