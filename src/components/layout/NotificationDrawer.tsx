import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import type { AppRoute } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { alerts, acknowledgeAlert } = useOperations();

  if (!isOpen) return null;

  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="notification-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3>Operational Alerts</h3>
            <span className="badge-count-pill">{activeAlerts.length} Active</span>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close alerts panel">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-content">
          {activeAlerts.length === 0 ? (
            <div className="drawer-empty-state">
              <CheckCircle2 size={36} className="text-emerald" />
              <h4>All Systems Clear</h4>
              <p>No unacknowledged operational bottlenecks or critical shortages.</p>
            </div>
          ) : (
            <div className="drawer-alert-list">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className={`drawer-alert-card severity-${alert.severity.toLowerCase()}`}>
                  <div className="drawer-card-top">
                    <span className="alert-badge-indicator">
                      {alert.severity === 'CRITICAL' && <AlertCircle size={15} />}
                      {alert.severity === 'WARNING' && <AlertTriangle size={15} />}
                      {alert.severity === 'INFO' && <Info size={15} />}
                      <span>{alert.severity}</span>
                    </span>
                    <span className="alert-dept-tag">{alert.department}</span>
                    <span className="alert-time-tag">{alert.timestamp}</span>
                  </div>

                  <h5 className="alert-card-title">{alert.title}</h5>
                  <p className="alert-card-summary">{alert.summary}</p>

                  <div className="drawer-card-actions">
                    {alert.status === 'NEW' ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="ack-status-text">✓ Acknowledged</span>
                    )}

                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        onNavigate('alerts');
                        onClose();
                      }}
                    >
                      <span>Resolve in Alerts</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => {
              onNavigate('alerts');
              onClose();
            }}
          >
            Open Full Alerts Console
          </button>
        </div>
      </aside>
    </div>
  );
};
