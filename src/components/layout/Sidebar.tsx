import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  Wrench,
  Bed,
  Stethoscope,
  Boxes,
  HeartPulse,
  Sparkles,
  CalendarClock,
  Users,
  BellRing,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import type { AppRoute } from '../../types';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';

type DemoRole = 'coordinator' | 'nurse' | 'housekeeping';

interface SidebarProps {
  currentRoute: AppRoute;
  demoRole: DemoRole;
  onDemoRoleChange: (role: DemoRole) => void;
  onNavigate: (route: AppRoute) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  demoRole,
  onDemoRoleChange,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { alerts, pharmacy } = useOperations();
  const { cases } = useHospitalFlow();

  const activeAlertCount = alerts.filter((a) => a.status !== 'RESOLVED').length;
  const pendingBedReviews = cases.filter((c) => c.status === 'AWAITING_REVIEW').length;
  const criticalDrugs = pharmacy.filter((p) => p.status === 'CRITICAL' || p.status === 'LOW_STOCK').length;

  const navItems = [
    {
      id: 'dashboard' as AppRoute,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    { id: 'nurse' as AppRoute, label: 'Nurse Panel', icon: HeartPulse, badge: undefined },
    { id: 'housekeeping' as AppRoute, label: 'Housekeeping', icon: Sparkles, badge: undefined },
    {
      id: 'labs' as AppRoute,
      label: 'Labs',
      icon: FlaskConical,
      badge: undefined,
    },
    {
      id: 'equipment' as AppRoute,
      label: 'Equipment',
      icon: Wrench,
      badge: undefined,
    },
    {
      id: 'beds' as AppRoute,
      label: 'Clinic Beds',
      icon: Bed,
      badge: pendingBedReviews > 0 ? `${pendingBedReviews}` : undefined,
      badgeTone: 'amber',
    },
    {
      id: 'camps' as AppRoute,
      label: 'Health Camps',
      icon: Stethoscope,
      badge: undefined,
    },
    {
      id: 'pharmacy' as AppRoute,
      label: 'Emergency Pharmacy',
      icon: Boxes,
      badge: criticalDrugs > 0 ? `${criticalDrugs}` : undefined,
      badgeTone: 'red',
    },
    {
      id: 'trauma' as AppRoute,
      label: 'Emergency & Trauma',
      icon: HeartPulse,
      badge: undefined,
    },
    {
      id: 'clinicians' as AppRoute,
      label: 'Doctor Schedule',
      icon: CalendarClock,
      badge: undefined,
    },
    {
      id: 'staff' as AppRoute,
      label: 'Staff Availability',
      icon: Users,
      badge: undefined,
    },
    {
      id: 'alerts' as AppRoute,
      label: 'Alerts',
      icon: BellRing,
      badge: activeAlertCount > 0 ? `${activeAlertCount}` : undefined,
      badgeTone: 'red',
    },
    {
      id: 'reports' as AppRoute,
      label: 'Reports',
      icon: BarChart3,
      badge: undefined,
    },
    {
      id: 'settings' as AppRoute,
      label: 'Settings',
      icon: Settings,
      badge: undefined,
    },
  ].filter((item) => demoRole === 'coordinator' || item.id === (demoRole === 'nurse' ? 'nurse' : 'housekeeping'));

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      {/* Brand & Wordmark */}
      <div className="sidebar-brand-box">
        <div className="brand-icon-wrap" aria-hidden="true">
          <Building2 className="brand-logo-icon" size={22} />
          <span className="live-status-dot" title="Operations Network Online" />
        </div>
        {!collapsed && (
          <div className="brand-info">
            <span className="brand-name">HospitalFlow</span>
            <span className="brand-subtitle">Command Center v2.4</span>
          </div>
        )}
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav" aria-label="Operations Navigation">
        <div className="sidebar-nav-section-title">
          {!collapsed && <span>OPERATIONAL MODULES</span>}
        </div>
        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <li key={item.id} className="sidebar-nav-item">
                <button
                  type="button"
                  className={`sidebar-nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="nav-icon" size={19} />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className={`nav-badge badge-${item.badgeTone || 'blue'}`}>
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge && (
                    <span className={`nav-badge-dot badge-${item.badgeTone || 'blue'}`} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Operator Pill / Session info */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="operator-card">
            <div className="operator-avatar">PS</div>
            <div className="operator-details">
              <span className="operator-name">{demoRole === 'coordinator' ? 'Dr. Priya Sharma' : demoRole === 'nurse' ? 'Nurse Demo Operator' : 'Housekeeping Demo Operator'}</span>
              <label className="operator-role demo-role-label">Demo role (local only)<select value={demoRole} onChange={(event) => onDemoRoleChange(event.target.value as DemoRole)} aria-label="Switch local demo role"><option value="coordinator">Coordinator</option><option value="nurse">Nurse</option><option value="housekeeping">Housekeeping</option></select></label>
              <div className="duty-status-indicator">
                <span className="duty-dot" />
                <span>On Duty • Shift A</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="operator-avatar-compact" title={demoRole + " demo operator"}>
            PS
          </div>
        )}

        {!collapsed && (
          <div className="sidebar-compliance-badge">
            <ShieldCheck size={14} />
            <span>Strict Zero PII Protocol</span>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
