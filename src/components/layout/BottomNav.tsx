import React from 'react';
import {
  LayoutDashboard,
  Bed,
  HeartPulse,
  FlaskConical,
  BellRing,
} from 'lucide-react';
import type { AppRoute } from '../../types';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentRoute,
  onNavigate,
}) => {
  const { alerts } = useOperations();
  const { cases } = useHospitalFlow();

  const activeAlertCount = alerts.filter((a) => a.status !== 'RESOLVED').length;
  const readyBeds = cases.filter((c) => c.status === 'BED_READY').length;

  const items: Array<{
    id: AppRoute;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
    badgeTone?: 'green' | 'red';
  }> = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'beds',
      label: 'Beds',
      icon: Bed,
      badge: readyBeds > 0 ? readyBeds : undefined,
      badgeTone: 'green',
    },
    {
      id: 'trauma',
      label: 'Trauma',
      icon: HeartPulse,
    },
    {
      id: 'labs',
      label: 'Labs',
      icon: FlaskConical,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: BellRing,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
      badgeTone: 'red',
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-bottom-tab ${isActive ? 'is-active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="bottom-tab-icon-wrap">
              <Icon size={20} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`bottom-tab-badge tone-${item.badgeTone || 'red'}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="bottom-tab-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
