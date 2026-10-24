import React from 'react';
import {
  LayoutDashboard,
  HeartHandshake,
  Sparkles,
  Bed,
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
  const pendingNursing = cases.filter((c) => !c.nursingComplete).length;
  const activeCleaning = cases.filter((c) => c.status === 'CLEANING_IN_PROGRESS' || c.status === 'REJECTED_RECLEAN').length;

  const items: Array<{
    id: AppRoute;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
    badgeTone?: 'blue' | 'teal' | 'red';
  }> = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'nursing',
      label: 'Nurses',
      icon: HeartHandshake,
      badge: pendingNursing > 0 ? pendingNursing : undefined,
      badgeTone: 'blue',
    },
    {
      id: 'housekeeping',
      label: 'Cleaners',
      icon: Sparkles,
      badge: activeCleaning > 0 ? activeCleaning : undefined,
      badgeTone: 'teal',
    },
    {
      id: 'beds',
      label: 'Beds',
      icon: Bed,
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
