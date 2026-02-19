import React, { ReactNode } from 'react';
import { useLocalData } from '@/hooks/useLocalData';
import { DataContext } from '@/contexts/data-context';

export function DataProvider({ children }: { children: ReactNode }) {
  const data = useLocalData();

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}
