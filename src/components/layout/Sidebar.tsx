import React, { useState } from 'react';
import {
  LayoutDashboard,
  HeartHandshake,
  Sparkles,
  FlaskConical,
  Wrench,
  Bed,
  Stethoscope,
  Boxes,
  HeartPulse,
  CalendarClock,
  Users,
  BellRing,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import type { AppRoute } from '../../types';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';
import { useRole } from '../../context/RoleContext';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenPersonaModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  onOpenPersonaModal,
}) => {
  const { alerts, pharmacy } = useOperations();
  const { cases } = useHospitalFlow();
  const { currentPersona, activePersonaId } = useRole();

  const [isOtherModulesExpanded, setIsOtherModulesExpanded] = useState(false);

  const activeAlertCount = alerts.filter((a) => a.status !== 'RESOLVED').length;
  const pendingBedReviews = cases.filter((c) => c.status === 'AWAITING_REVIEW').length;
  const pendingNursing = cases.filter((c) => !c.nursingComplete).length;
  const activeCleaning = cases.filter((c) => c.status === 'CLEANING_IN_PROGRESS' || c.status === 'REJECTED_RECLEAN').length;
  const criticalDrugs = pharmacy.filter((p) => p.status === 'CRITICAL' || p.status === 'LOW_STOCK').length;

  const allNavItems = [
    {
      id: 'dashboard' as AppRoute,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'nursing' as AppRoute,
      label: 'Nurse Station',
      icon: HeartHandshake,
      badge: pendingNursing > 0 ? `${pendingNursing}` : undefined,
      badgeTone: 'blue',
    },
    {
      id: 'housekeeping' as AppRoute,
      label: 'Housekeeping',
      icon: Sparkles,
      badge: activeCleaning > 0 ? `${activeCleaning}` : undefined,
      badgeTone: 'teal',
    },
    {
      id: 'beds' as AppRoute,
      label: 'Clinic Beds',
      icon: Bed,
      badge: pendingBedReviews > 0 ? `${pendingBedReviews}` : undefined,
      badgeTone: 'amber',
    },
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
  ];

  // Role segregation
  const isSegregated = activePersonaId !== 'ALL_ADMIN';
  const primaryNavItems = isSegregated
    ? allNavItems.filter((item) => currentPersona.primaryRoutes.includes(item.id))
    : allNavItems;
  const secondaryNavItems = isSegregated
    ? allNavItems.filter((item) => !currentPersona.primaryRoutes.includes(item.id))
    : [];

  const renderNavList = (items: typeof allNavItems) => (
    <ul className="sidebar-nav-list">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.id;
        return (
          <li key={item.id} className="sidebar-nav-item">
            <button
              type="button"
              className={`sidebar-nav-link ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
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
  );

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
          <div className="brand-icon-wrap" aria-hidden="true" title="HospitalFlow Operations">
            <img
              src="/hospitalflow-logo.jpg"
              alt="HospitalFlow Logo"
              className="brand-logo-img"
            />
            <span className="live-status-dot" title="Operations Network Online" />
          </div>
          {!collapsed && (
            <div className="brand-info">
              <span className="brand-name">HospitalFlow</span>
              <span className="brand-subtitle">Connect • Coordinate • Care</span>
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
            {!collapsed && (
              <span>
                {isSegregated ? `${currentPersona.roleShort.toUpperCase()} WORKSPACE` : 'OPERATIONAL MODULES'}
              </span>
            )}
          </div>

          {renderNavList(primaryNavItems)}

          {/* Collapsible Secondary Modules when Role Segregated */}
          {isSegregated && !collapsed && (
            <div className="secondary-modules-section">
              <button
                type="button"
                className="secondary-section-toggle"
                onClick={() => setIsOtherModulesExpanded((prev) => !prev)}
                title="View other hospital modules"
              >
                <span>OTHER DEPARTMENTS ({secondaryNavItems.length})</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${isOtherModulesExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {isOtherModulesExpanded && renderNavList(secondaryNavItems)}
            </div>
          )}

          {isSegregated && collapsed && (
            <div className="collapsed-divider" title="Other hospital modules below" />
          )}

          {isSegregated && collapsed && renderNavList(secondaryNavItems)}
        </nav>

        {/* Operator Pill / Session info with Persona Switcher trigger */}
        <div className="sidebar-footer">
          {!collapsed ? (
            <div
              className="operator-card cursor-pointer"
              onClick={onOpenPersonaModal}
              title="Click to switch hospital persona or view responsibilities"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onOpenPersonaModal && onOpenPersonaModal()}
            >
              <div
                className="operator-avatar"
                style={{ backgroundColor: currentPersona.avatarColor }}
              >
                {currentPersona.initials}
              </div>
              <div className="operator-details">
                <span className="operator-name">{currentPersona.name}</span>
                <span className="operator-role">{currentPersona.roleShort}</span>
                <div className="duty-status-indicator">
                  <span className="duty-dot" />
                  <span>{currentPersona.shift.split('(')[0]}</span>
                </div>
              </div>
              <UserCheck size={14} className="operator-switch-icon" />
            </div>
          ) : (
            <div
              className="operator-avatar-compact cursor-pointer"
              onClick={onOpenPersonaModal}
              title={`${currentPersona.name} (${currentPersona.roleShort}) - Click to switch`}
              style={{ backgroundColor: currentPersona.avatarColor }}
            >
              {currentPersona.initials}
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

