import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import type { OperationalAlert } from '../../types';

export const OperationalAlerts: React.FC = () => {
  const { alerts, acknowledgeAlert, resolveAlert } = useOperations();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Resolve Modal State
  const [resolvingAlert, setResolvingAlert] = useState<OperationalAlert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actorName, setActorName] = useState('Dr. Priya Sharma');

  const departments = ['ALL', 'Emergency Pharmacy', 'Operation Theatre 2', 'Ward 4B (Stepdown)', 'Emergency & Trauma', 'Anesthesia', 'Critical Care Lab'];

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
    if (departmentFilter !== 'ALL' && alert.department !== departmentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(q) ||
        alert.summary.toLowerCase().includes(q) ||
        alert.department.toLowerCase().includes(q) ||
        (alert.resourceRef && alert.resourceRef.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING' && a.status !== 'RESOLVED').length;
  const infoCount = alerts.filter((a) => a.severity === 'INFO' && a.status !== 'RESOLVED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  const handleOpenResolveModal = (alert: OperationalAlert) => {
    setResolvingAlert(alert);
    setResolutionNote('Root cause addressed. Corrective operational action verified by coordinator.');
    setActorName('Dr. Priya Sharma');
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert || !resolutionNote.trim()) return;

    resolveAlert(resolvingAlert.id, resolutionNote.trim(), actorName.trim());
    setResolvingAlert(null);
  };

  return (
    <div className="alerts-workspace-page">
      {/* Top Severity Counters Summary */}
      <div className="alerts-summary-banner">
        <div className="alert-count-card critical" onClick={() => setSeverityFilter('CRITICAL')}>
          <div className="count-card-top">
            <AlertCircle size={18} />
            <span>Critical Blockers</span>
          </div>
          <strong className="count-number">{criticalCount}</strong>
          <span className="count-desc">Immediate coordinator intervention required</span>
        </div>

        <div className="alert-count-card warning" onClick={() => setSeverityFilter('WARNING')}>
          <div className="count-card-top">
            <AlertTriangle size={18} />
            <span>Operational Warnings</span>
          </div>
          <strong className="count-number">{warningCount}</strong>
          <span className="count-desc">Approaching bottleneck or threshold limit</span>
        </div>

        <div className="alert-count-card info" onClick={() => setSeverityFilter('INFO')}>
          <div className="count-card-top">
            <Info size={18} />
            <span>System Advisories</span>
          </div>
          <strong className="count-number">{infoCount}</strong>
          <span className="count-desc">Routine calibration & shift notifications</span>
        </div>

        <div className="alert-count-card resolved" onClick={() => setStatusFilter('RESOLVED')}>
          <div className="count-card-top">
            <CheckCircle2 size={18} />
            <span>Resolved Exceptions</span>
          </div>
          <strong className="count-number">{resolvedCount}</strong>
          <span className="count-desc">Audit trail verified and closed</span>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-filter-box">
            <Filter size={15} className="text-slate" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by severity"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warnings Only</option>
              <option value="INFO">Informational Only</option>
            </select>
          </div>

          <div className="toolbar-filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New (Unacknowledged)</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="toolbar-filter-box">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by department"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-search-box">
            <Search size={15} className="text-slate" />
            <input
              type="text"
              placeholder="Search alert title or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="toolbar-search-input"
            />
          </div>
        </div>

        <div className="toolbar-right">
          {(severityFilter !== 'ALL' || statusFilter !== 'ALL' || departmentFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSeverityFilter('ALL');
                setStatusFilter('ALL');
                setDepartmentFilter('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Alerts Table & Detail Stack */}
      <div className="ops-card">
        <div className="table-responsive">
          <table className="enterprise-data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alert Title & Description</th>
                <th>Department</th>
                <th>Resource Ref</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th className="text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    No operational alerts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isNew = alert.status === 'NEW';
                  const isAck = alert.status === 'ACKNOWLEDGED';
                  const isResolved = alert.status === 'RESOLVED';

                  return (
                    <tr
                      key={alert.id}
                      className={`alert-table-row severity-${alert.severity.toLowerCase()} ${isResolved ? 'row-resolved' : ''}`}
                    >
                      <td>
                        <StatusBadge
                          label={alert.severity}
                          tone={
                            alert.severity === 'CRITICAL'
                              ? 'red'
                              : alert.severity === 'WARNING'
                              ? 'amber'
                              : 'blue'
                          }
                          size="sm"
                        />
                      </td>
                      <td>
                        <strong className="table-cell-title">{alert.title}</strong>
                        <p className="table-cell-desc">{alert.summary}</p>
                        {alert.details && <span className="table-cell-subtext">{alert.details}</span>}
                        {alert.resolutionNote && (
                          <div className="resolution-audit-box">
                            <strong>✓ Resolved by {alert.resolvedBy}:</strong> {alert.resolutionNote}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="dept-tag">{alert.department}</span>
                      </td>
                      <td>
                        {alert.resourceRef ? (
                          <span className="resource-ref-pill">{alert.resourceRef}</span>
                        ) : (
                          <span className="text-slate text-sm">—</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          label={alert.status}
                          tone={isNew ? 'red' : isAck ? 'amber' : 'green'}
                          size="sm"
                          dot={false}
                        />
                      </td>
                      <td>
                        <span className="time-tag">{alert.timestamp}</span>
                      </td>
                      <td className="text-right">
                        <div className="alert-actions-cell">
                          {isNew && (
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </button>
                          )}

                          {!isResolved && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleOpenResolveModal(alert)}
                            >
                              Resolve
                            </button>
                          )}

                          {isResolved && (
                            <span className="resolved-checkmark">
                              <CheckCircle2 size={16} className="text-emerald" /> Closed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Note Modal */}
      {resolvingAlert && (
        <div className="search-modal-backdrop" onClick={() => setResolvingAlert(null)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CheckCircle2 size={20} className="text-emerald" />
                <h3>Resolve Operational Exception</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setResolvingAlert(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="modal-form">
              <div className="alert-resolution-preview">
                <strong>{resolvingAlert.title}</strong>
                <span>{resolvingAlert.department} • {resolvingAlert.summary}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Resolving Coordinator / Staff Identifier</label>
                <input
                  type="text"
                  className="form-control"
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Audit Note (Mandatory)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  required
                  placeholder="Document corrective actions taken to resolve this bottleneck..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResolvingAlert(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Resolution & Close Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
