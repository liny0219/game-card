import React, { createContext, useContext, ReactNode } from 'react';
import { DataAdapter } from '../types';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';

interface DataContextType {
  dataAdapter: DataAdapter;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataContextProviderProps {
  children: ReactNode;
}

export function DataContextProvider({ children }: DataContextProviderProps) {
  const dataAdapter = new LocalStorageAdapter();

  return (
    <DataContext.Provider value={{ dataAdapter }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataAdapter(): DataAdapter {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataAdapter must be used within a DataContextProvider');
  }
  return context.dataAdapter;
} 