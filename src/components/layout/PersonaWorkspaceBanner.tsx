import React from 'react';
import {
  UserCheck,
  Sparkles,
  HeartHandshake,
  HeartPulse,
  Boxes,
  Wrench,
  LayoutDashboard,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';
import type { AppRoute, HospitalPersonaId } from '../../types';

interface PersonaWorkspaceBannerProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenPersonaModal: () => void;
}

const PERSONA_ICONS: Record<HospitalPersonaId, React.ComponentType<{ size?: number; className?: string }>> = {
  ALL_ADMIN: LayoutDashboard,
  CHARGE_NURSE: HeartHandshake,
  HOUSEKEEPING_LEAD: Sparkles,
  EMERGENCY_PHYSICIAN: HeartPulse,
  CLINICAL_PHARMACIST: Boxes,
  BIOMEDICAL_ENGINEER: Wrench,
};

export const PersonaWorkspaceBanner: React.FC<PersonaWorkspaceBannerProps> = ({
  currentRoute,
  onNavigate,
  onOpenPersonaModal,
}) => {
  const { currentPersona, activePersonaId } = useRole();
  const { cases } = useHospitalFlow();
  const { pharmacy, traumaBays, doctors, equipment, alerts } = useOperations();

  const Icon = PERSONA_ICONS[activePersonaId] || LayoutDashboard;

  // Role-specific live telemetry
  const pendingHandoffs = cases.filter((c) => !c.nursingComplete).length;
  const readyToVacate = cases.filter((c) => c.nursingComplete && !c.departureConfirmed).length;
  const activeCleaning = cases.filter((c) => c.status === 'CLEANING_IN_PROGRESS').length;
  const readyForScan = cases.filter((c) => c.status === 'AWAITING_REVIEW').length;
  const recleanAnomalies = cases.filter((c) => c.status === 'REJECTED_RECLEAN').length;
  const criticalDrugs = pharmacy.filter((p) => p.status === 'CRITICAL' || p.status === 'LOW_STOCK').length;
  const readyTraumaBays = traumaBays.filter((b) => b.status === 'READY').length;
  const onDutyDoctors = doctors.filter((d) => d.status === 'ON_DUTY').length;
  const inUseEquipment = equipment.filter((e) => e.status === 'IN_USE').length;
  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED').length;

  return (
    <div className={`persona-workspace-banner tone-${currentPersona.badgeTone}`}>
      <div className="persona-banner-container">
        {/* Left: Active Persona Identity */}
        <div className="persona-banner-identity">
          <div
            className="persona-banner-avatar"
            style={{ backgroundColor: currentPersona.avatarColor }}
          >
            {currentPersona.initials}
          </div>
          <div className="persona-banner-text">
            <div className="persona-badge-row">
              <span className={`persona-role-badge badge-${currentPersona.badgeTone}`}>
                <Icon size={12} />
                <span>{currentPersona.roleShort.toUpperCase()}</span>
              </span>
              <span className="persona-shift-tag">
                <Clock size={11} />
                <span>{currentPersona.shift}</span>
              </span>
            </div>
            <div className="persona-name-area">
              <strong className="persona-name">{currentPersona.name}</strong>
              <span className="persona-area-divider">•</span>
              <span className="persona-area">
                <MapPin size={12} />
                <span>{currentPersona.assignedArea}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Actionable Metrics tailored to this Role */}
        <div className="persona-live-metrics">
          {activePersonaId === 'CHARGE_NURSE' && (
            <>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('nursing')}
                title="Click to view pending clinical handoffs"
              >
                <span className="metric-pill-val text-blue">{pendingHandoffs}</span>
                <span className="metric-pill-lbl">Handoffs Pending</span>
              </div>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('beds')}
                title="Click to coordinate room departures"
              >
                <span className="metric-pill-val text-amber">{readyToVacate}</span>
                <span className="metric-pill-lbl">Vacate Clearance</span>
              </div>
            </>
          )}

          {activePersonaId === 'HOUSEKEEPING_LEAD' && (
            <>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('housekeeping')}
                title="Active cleaning cycles in progress"
              >
                <span className="metric-pill-val text-teal">{activeCleaning}</span>
                <span className="metric-pill-lbl">In Disinfection</span>
              </div>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('housekeeping')}
                title="Awaiting autonomous AI vision scan"
              >
                <span className="metric-pill-val text-amber">{readyForScan}</span>
                <span className="metric-pill-lbl">AI Scan Queue</span>
              </div>
              {recleanAnomalies > 0 && (
                <div
                  className="persona-metric-pill cursor-pointer pill-alert"
                  onClick={() => onNavigate('housekeeping')}
                  title="Vision flagged residue or unmade linens"
                >
                  <span className="metric-pill-val text-red">{recleanAnomalies}</span>
                  <span className="metric-pill-lbl">Re-Clean Alerts</span>
                </div>
              )}
            </>
          )}

          {activePersonaId === 'EMERGENCY_PHYSICIAN' && (
            <>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('trauma')}
                title="Ready trauma & resuscitation bays"
              >
                <span className="metric-pill-val text-emerald">{readyTraumaBays}</span>
                <span className="metric-pill-lbl">Trauma Bays Ready</span>
              </div>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('clinicians')}
                title="On-duty doctors available right now"
              >
                <span className="metric-pill-val text-blue">{onDutyDoctors}</span>
                <span className="metric-pill-lbl">Physicians On Duty</span>
              </div>
            </>
          )}

          {activePersonaId === 'CLINICAL_PHARMACIST' && (
            <>
              <div
                className="persona-metric-pill cursor-pointer pill-alert"
                onClick={() => onNavigate('pharmacy')}
                title="Formulary drugs below safety buffer"
              >
                <span className="metric-pill-val text-red">{criticalDrugs}</span>
                <span className="metric-pill-lbl">Critical Stockouts</span>
              </div>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('alerts')}
                title="Active supply chain bottleneck notifications"
              >
                <span className="metric-pill-val text-amber">{activeAlerts}</span>
                <span className="metric-pill-lbl">Supply Alerts</span>
              </div>
            </>
          )}

          {activePersonaId === 'BIOMEDICAL_ENGINEER' && (
            <>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('equipment')}
                title="Critical biomedical units actively in patient use"
              >
                <span className="metric-pill-val text-purple">{inUseEquipment}</span>
                <span className="metric-pill-lbl">Assets Active</span>
              </div>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('equipment')}
                title="Maintenance or calibration scheduled"
              >
                <span className="metric-pill-val text-amber">3</span>
                <span className="metric-pill-lbl">Calibrations Due</span>
              </div>
            </>
          )}

          {activePersonaId === 'ALL_ADMIN' && (
            <>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('alerts')}
                title="Unresolved hospital operational alerts"
              >
                <span className="metric-pill-val text-red">{activeAlerts}</span>
                <span className="metric-pill-lbl">System Alerts</span>
              </div>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('nursing')}
                title="Nursing handoffs awaiting discharge"
              >
                <span className="metric-pill-val text-blue">{pendingHandoffs}</span>
                <span className="metric-pill-lbl">Nurse Handoffs</span>
              </div>
              <div
                className="persona-metric-pill cursor-pointer"
                onClick={() => onNavigate('housekeeping')}
                title="Rooms in cleaning cycle"
              >
                <span className="metric-pill-val text-teal">{activeCleaning}</span>
                <span className="metric-pill-lbl">Sanitizing</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Quick Action Buttons & Switcher Trigger */}
        <div className="persona-banner-actions">
          {currentPersona.quickActions.slice(0, 2).map((action) => {
            const isCurrent = currentRoute === action.route;
            return (
              <button
                key={action.route}
                type="button"
                className={`btn btn-sm ${isCurrent ? 'btn-primary' : 'btn-secondary'} persona-quick-btn desktop-only`}
                onClick={() => onNavigate(action.route)}
              >
                <span>{action.label}</span>
                <ChevronRight size={13} />
              </button>
            );
          })}

          <button
            type="button"
            className="persona-switch-btn"
            onClick={onOpenPersonaModal}
            title="Switch individual hospital role & responsibilities"
          >
            <UserCheck size={14} />
            <span>Switch Role</span>
          </button>
        </div>
      </div>
    </div>
  );
};
