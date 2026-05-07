import React, { createContext, useContext, useEffect, useMemo } from 'react';

const GridColsContext = createContext(null);

export function GridColsProvider({ children }) {
  // Grid columns are always auto for now; keep context shape stable for callers.
  const maxCols = 99;
  const setMaxCols = () => {};

  useEffect(() => {
    localStorage.setItem('gridMaxCols', '99');
  }, []);

  const value = useMemo(() => ({ maxCols, setMaxCols }), [maxCols]);
  return <GridColsContext.Provider value={value}>{children}</GridColsContext.Provider>;
}

export function useGridCols() {
  const ctx = useContext(GridColsContext);
  if (!ctx) throw new Error('useGridCols must be used within GridColsProvider');
  return ctx;
}
