import React, { useState, useEffect } from 'react';
import { HospitalFlowProvider, useHospitalFlow } from './context/HospitalFlowContext';
import { OperationsProvider } from './context/OperationsContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';

import { OperationsDashboard } from './components/dashboard/OperationsDashboard';
import { LabManagement } from './components/labs/LabManagement';
import { EquipmentManagement } from './components/equipment/EquipmentManagement';
import { ClinicBedManagement } from './components/beds/ClinicBedManagement';
import { HealthCampManagement } from './components/camps/HealthCampManagement';
import { EmergencyPharmacy } from './components/pharmacy/EmergencyPharmacy';
import { EmergencyTrauma } from './components/trauma/EmergencyTrauma';
import { DoctorSchedule } from './components/doctors/DoctorSchedule';
import { StaffAvailability } from './components/staff/StaffAvailability';
import { OperationalAlerts } from './components/alerts/OperationalAlerts';
import { ReportsWorkspace } from './components/reports/ReportsWorkspace';
import { SettingsWorkspace } from './components/settings/SettingsWorkspace';

import { CreateCaseModal } from './components/CreateCaseModal';
import { SimulationControlsModal } from './components/SimulationControlsModal';
import { SettingsModal } from './components/SettingsModal';

import type { AppRoute } from './types';
import { CheckCircle2, AlertCircle, Info, X, Shield } from 'lucide-react';
import './App.css';

function getInitialRoute(): AppRoute {
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  const validRoutes: AppRoute[] = [
    'dashboard',
    'labs',
    'equipment',
    'beds',
    'camps',
    'pharmacy',
    'trauma',
    'clinicians',
    'staff',
    'alerts',
    'reports',
    'settings',
  ];
  if (path === '' || path === 'home') return 'dashboard';
  if (validRoutes.includes(path as AppRoute)) return path as AppRoute;
  return 'dashboard';
}

const HospitalFlowCommandCenter: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateCaseOpen, setIsCreateCaseOpen] = useState(false);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [isOldSettingsOpen, setIsOldSettingsOpen] = useState(false);

  const { notification, clearNotification } = useHospitalFlow();

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    setMobileMenuOpen(false);
    const path = route === 'dashboard' ? '/' : `/${route}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-enterprise-shell">
      {/* Deep-Navy Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Viewport */}
      <div className="app-main-viewport">
        {/* Top Navigation */}
        <TopNav
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenCreateCase={() => setIsCreateCaseOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Global Toast Notification */}
        {notification && (
          <div className={`notification-toast ${notification.type}`} role="status">
            <div className="toast-content">
              {notification.type === 'success' && <CheckCircle2 className="toast-icon" />}
              {notification.type === 'error' && <AlertCircle className="toast-icon" />}
              {notification.type === 'info' && <Info className="toast-icon" />}
              <span className="toast-message">{notification.message}</span>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={clearNotification}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Scrollable Page Body */}
        <main className="app-scrollable-content">
          {currentRoute === 'dashboard' && (
            <OperationsDashboard
              onNavigate={navigateTo}
              onOpenCreateCase={() => setIsCreateCaseOpen(true)}
            />
          )}

          {currentRoute === 'labs' && <LabManagement />}

          {currentRoute === 'equipment' && <EquipmentManagement />}

          {currentRoute === 'beds' && (
            <ClinicBedManagement
              onOpenCreateCase={() => setIsCreateCaseOpen(true)}
            />
          )}

          {currentRoute === 'camps' && <HealthCampManagement />}

          {currentRoute === 'pharmacy' && <EmergencyPharmacy />}

          {currentRoute === 'trauma' && <EmergencyTrauma />}

          {currentRoute === 'clinicians' && <DoctorSchedule />}

          {currentRoute === 'staff' && <StaffAvailability />}

          {currentRoute === 'alerts' && <OperationalAlerts />}

          {currentRoute === 'reports' && <ReportsWorkspace />}

          {currentRoute === 'settings' && <SettingsWorkspace />}
        </main>

        {/* Enterprise Operational Footer */}
        <footer className="app-footer">
          <div className="footer-container">
            <div className="footer-left">
              <img
                src="/hospitalflow-logo.jpg"
                alt="HospitalFlow Logo"
                className="footer-logo-img"
              />
              <span className="footer-brand">HospitalFlow Enterprise</span>
              <span className="footer-divider">•</span>
              <span>Healthcare Resource Coordination Platform</span>
              <span className="footer-divider">•</span>
              <span className="footer-tag">CONNECT • COORDINATE • CARE</span>
            </div>
            <div className="footer-right">
              <Shield className="footer-shield" />
              <span>
                Strict Zero PII Protocol • Synthetic Demo Sandbox • Client-Side Verified Storage
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateTo}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={navigateTo}
      />

      <CreateCaseModal
        isOpen={isCreateCaseOpen}
        onClose={() => setIsCreateCaseOpen(false)}
      />

      <SimulationControlsModal
        isOpen={isSimOpen}
        onClose={() => setIsSimOpen(false)}
      />

      <SettingsModal
        isOpen={isOldSettingsOpen}
        onClose={() => setIsOldSettingsOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <OperationsProvider>
      <HospitalFlowProvider>
        <HospitalFlowCommandCenter />
      </HospitalFlowProvider>
    </OperationsProvider>
  );
}

export default App;
