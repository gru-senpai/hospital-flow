import React, { createContext, useContext, useState } from 'react';
import type { HospitalPersona, HospitalPersonaId, AppRoute } from '../types';
import { PERSONA_PRESETS } from '../types';

interface RoleContextType {
  currentPersona: HospitalPersona;
  activePersonaId: HospitalPersonaId;
  switchPersona: (id: HospitalPersonaId, navigateCallback?: (route: AppRoute) => void) => void;
  allPersonas: HospitalPersona[];
  isPrimaryModule: (route: AppRoute) => boolean;
}

const STORAGE_KEY = 'hospitalflow_active_persona_v1';

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersonaId, setActivePersonaId] = useState<HospitalPersonaId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && PERSONA_PRESETS.some((p) => p.id === saved)) {
        return saved as HospitalPersonaId;
      }
    } catch {
      // Fallback
    }
    return 'ALL_ADMIN';
  });

  const currentPersona = PERSONA_PRESETS.find((p) => p.id === activePersonaId) || PERSONA_PRESETS[0];

  const switchPersona = (id: HospitalPersonaId, navigateCallback?: (route: AppRoute) => void) => {
    const targetPersona = PERSONA_PRESETS.find((p) => p.id === id);
    if (!targetPersona) return;

    setActivePersonaId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }

    if (navigateCallback) {
      navigateCallback(targetPersona.defaultRoute);
    }
  };

  const isPrimaryModule = (route: AppRoute): boolean => {
    if (activePersonaId === 'ALL_ADMIN') return true;
    return currentPersona.primaryRoutes.includes(route);
  };

  return (
    <RoleContext.Provider
      value={{
        currentPersona,
        activePersonaId,
        switchPersona,
        allPersonas: PERSONA_PRESETS,
        isPrimaryModule,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
