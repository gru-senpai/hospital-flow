import React, { createContext, useContext } from 'react';
import { useOperationsData } from '../services/operationsStore';

type OperationsContextType = ReturnType<typeof useOperationsData>;

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const operations = useOperationsData();

  return (
    <OperationsContext.Provider value={operations}>
      {children}
    </OperationsContext.Provider>
  );
};

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
}
