import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const GridColsContext = createContext(null);

export function GridColsProvider({ children }) {
  const [maxCols, setMaxCols] = useState(() => {
    const raw = localStorage.getItem('gridMaxCols');
    const n = Number(raw);
    if (!Number.isFinite(n)) return 3;
    // Allow a large number for "Auto" (effectively uncapped).
    return Math.min(99, Math.max(1, Math.floor(n)));
  });

  useEffect(() => {
    localStorage.setItem('gridMaxCols', String(maxCols));
  }, [maxCols]);

  const value = useMemo(() => ({ maxCols, setMaxCols }), [maxCols]);
  return <GridColsContext.Provider value={value}>{children}</GridColsContext.Provider>;
}

export function useGridCols() {
  const ctx = useContext(GridColsContext);
  if (!ctx) throw new Error('useGridCols must be used within GridColsProvider');
  return ctx;
}
