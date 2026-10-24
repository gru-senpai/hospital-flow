import React from 'react';
import {
  Search,
  Bell,
  RefreshCw,
  Building,
  PlusCircle,
  Menu,
} from 'lucide-react';
import type { AppRoute } from '../../types';
import { useOperations } from '../../context/OperationsContext';

interface TopNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenCreateCase?: () => void;
  onToggleMobileMenu: () => void;
}

const ROUTE_LABELS: Record<AppRoute, { title: string; breadcrumb: string }> = {
  dashboard: { title: 'Operations Dashboard', breadcrumb: 'Command Center / Global Overview' },
  labs: { title: 'Lab Operations & Diagnostics', breadcrumb: 'Clinical Support / Laboratory Automation' },
  equipment: { title: 'Equipment & Asset Management', breadcrumb: 'Biomedical Engineering / Critical Assets' },
  beds: { title: 'Clinic Bed Coordination', breadcrumb: 'Inpatient Care / Room Readiness & Turnaround' },
  camps: { title: 'Health Outreach Camps', breadcrumb: 'Community Outreach / Field Unit Allocations' },
  pharmacy: { title: 'Emergency Pharmacy & Formulary', breadcrumb: 'Supply Chain / Critical Care Inventory' },
  trauma: { title: 'Emergency & Trauma Center', breadcrumb: 'Acute Care / Bay Readiness & Resuscitation' },
  clinicians: { title: 'Doctor Scheduling & Coverage', breadcrumb: 'Medical Staffing / On-Duty Roster' },
  staff: { title: 'Staff Availability & Nursing', breadcrumb: 'Workforce Coordination / Shift Fulfillment' },
  alerts: { title: 'Operational Alerts & Bottlenecks', breadcrumb: 'System Monitoring / Exception Log' },
  reports: { title: 'Operational Analytics & Reports', breadcrumb: 'Executive Intelligence / Performance KPIs' },
  settings: { title: 'System & Workflow Settings', breadcrumb: 'Administration / Facility Configuration' },
};

export const TopNav: React.FC<TopNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenSearch,
  onOpenNotifications,
  onOpenCreateCase,
  onToggleMobileMenu,
}) => {
  const { alerts, lastSyncTime, triggerSync } = useOperations();
  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED').length;
  const currentInfo = ROUTE_LABELS[currentRoute] || { title: 'HospitalFlow', breadcrumb: 'Operations' };

  const formatFreshness = () => {
    const diffSeconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    return `${Math.floor(diffSeconds / 60)}m ago`;
  };

  return (
    <header className="app-topnav">
      {/* Mobile Menu & Brand */}
      <div className="mobile-header-brand">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <img
          src="/hospitalflow-logo.jpg"
          alt="HospitalFlow"
          className="mobile-brand-logo"
        />
      </div>

      {/* Breadcrumb & Contextual Title */}
      <div className="topnav-titles">
        <span className="topnav-breadcrumb">{currentInfo.breadcrumb}</span>
        <h1 className="topnav-heading">{currentInfo.title}</h1>
      </div>

      {/* Global Search Bar */}
      <div className="topnav-search-wrap">
        <button
          type="button"
          className="topnav-search-trigger"
          onClick={onOpenSearch}
          title="Search all hospital resources (Ctrl + K)"
        >
          <Search size={16} className="search-icon" />
          <span className="search-placeholder">Search beds, equipment, drugs, doctors...</span>
          <kbd className="search-kbd">⌘K</kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="topnav-actions">
        {/* Sync & Data Freshness */}
        <button
          type="button"
          className="sync-status-pill"
          onClick={triggerSync}
          title="Click to force data sync across operational stations"
        >
          <span className="sync-live-dot" />
          <span className="sync-text">Live Sync • {formatFreshness()}</span>
          <RefreshCw size={13} className="sync-refresh-icon" />
        </button>

        {/* Facility Selector */}
        <div className="facility-selector-badge" title="Active facility network">
          <Building size={14} className="facility-icon" />
          <span className="facility-name">Apollo Central Hospital</span>
        </div>

        {/* Notifications Bell */}
        <button
          type="button"
          className="notification-bell-btn"
          onClick={onOpenNotifications}
          aria-label={`View notifications, ${activeAlerts} active`}
          title={`${activeAlerts} active operational alert(s)`}
        >
          <Bell size={18} />
          {activeAlerts > 0 && <span className="bell-badge-count">{activeAlerts}</span>}
        </button>

        {/* Primary Page Action Button */}
        {currentRoute === 'beds' && onOpenCreateCase && (
          <button
            type="button"
            className="btn btn-primary btn-sm topnav-primary-action"
            onClick={onOpenCreateCase}
          >
            <PlusCircle size={15} />
            <span>+ Create Bed Case</span>
          </button>
        )}

        {currentRoute === 'alerts' && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('dashboard')}
          >
            <span>Overview Dashboard</span>
          </button>
        )}
      </div>
    </header>
  );
};
