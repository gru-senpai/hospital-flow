import React from 'react';
import {
  X,
  UserCheck,
  Check,
  ArrowRight,
  Shield,
  Clock,
  MapPin,
  Sparkles,
  HeartHandshake,
  HeartPulse,
  Boxes,
  Wrench,
  LayoutDashboard,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import type { HospitalPersonaId, AppRoute } from '../../types';

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

const PERSONA_ICONS: Record<HospitalPersonaId, React.ComponentType<{ size?: number; className?: string }>> = {
  ALL_ADMIN: LayoutDashboard,
  CHARGE_NURSE: HeartHandshake,
  HOUSEKEEPING_LEAD: Sparkles,
  EMERGENCY_PHYSICIAN: HeartPulse,
  CLINICAL_PHARMACIST: Boxes,
  BIOMEDICAL_ENGINEER: Wrench,
};

export const PersonaSelectorModal: React.FC<PersonaSelectorModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { activePersonaId, switchPersona, allPersonas } = useRole();

  if (!isOpen) return null;

  const handleSelect = (id: HospitalPersonaId) => {
    switchPersona(id, (route) => {
      onNavigate(route);
      onClose();
    });
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="persona-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="persona-modal-header">
          <div className="modal-header-titles">
            <div className="persona-header-badge">
              <UserCheck size={14} />
              <span>ROLE-BASED WORKSPACE SEGREGATION</span>
            </div>
            <h2>Switch Operational Persona</h2>
            <p className="persona-header-sub">
              Segregate hospital dashboards and telemetry to view only the tools, stations, and alerts specific to your clinical or operational duties.
            </p>
          </div>
          <button
            type="button"
            className="persona-modal-close"
            onClick={onClose}
            aria-label="Close role switcher"
          >
            <X size={18} />
          </button>
        </div>

        {/* Roles Grid */}
        <div className="persona-grid">
          {allPersonas.map((persona) => {
            const Icon = PERSONA_ICONS[persona.id];
            const isSelected = persona.id === activePersonaId;

            return (
              <div
                key={persona.id}
                className={`persona-option-card tone-${persona.badgeTone} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelect(persona.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(persona.id)}
              >
                <div className="persona-card-top">
                  <div
                    className="persona-avatar-circle"
                    style={{ backgroundColor: persona.avatarColor }}
                  >
                    {persona.initials}
                  </div>
                  <div className="persona-title-group">
                    <span className="persona-card-role-label">
                      <Icon size={12} className="persona-role-inline-icon" />
                      {persona.roleShort}
                    </span>
                    <strong className="persona-card-name">{persona.name}</strong>
                    <span className="persona-card-dept">{persona.department}</span>
                  </div>
                  <div className="persona-select-indicator">
                    {isSelected ? (
                      <span className="selected-check-pill">
                        <Check size={14} /> Active
                      </span>
                    ) : (
                      <span className="switch-to-pill">
                        Select <ArrowRight size={12} />
                      </span>
                    )}
                  </div>
                </div>

                <div className="persona-meta-bar">
                  <div className="meta-item">
                    <Clock size={12} />
                    <span>{persona.shift}</span>
                  </div>
                  <div className="meta-item">
                    <MapPin size={12} />
                    <span>{persona.assignedArea}</span>
                  </div>
                </div>

                <div className="persona-responsibilities-box">
                  <span className="resp-title">Core Responsibilities:</span>
                  <ul className="resp-list">
                    {persona.coreResponsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>

                <div className="persona-quick-routes">
                  <span className="quick-routes-label">Dedicated Stations:</span>
                  <div className="routes-chips">
                    {persona.primaryRoutes.map((r) => (
                      <span key={r} className="route-chip">
                        {r.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="persona-modal-footer">
          <div className="modal-footer-security">
            <Shield size={14} className="text-teal" />
            <span>Zero PII Protocol Active • Instant Role Telemetry Segregation</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
