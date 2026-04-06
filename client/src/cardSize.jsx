import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CardSizeContext = createContext(null);

export function CardSizeProvider({ children }) {
  const [size, setSize] = useState(() => localStorage.getItem('cardSize') || 'md');

  useEffect(() => {
    localStorage.setItem('cardSize', size);

    // Use clamp() so sizing adapts to phone vs desktop widths.
    // These are CSS strings intentionally (not numbers).
    const sm = {
      min: 'clamp(160px, 44vw, 220px)',
      h: 'clamp(60px, 16vw, 64px)',
      w: 'clamp(42px, 12vw, 46px)'
    };

    const md = {
      min: 'clamp(180px, 50vw, 280px)',
      h: 'clamp(70px, 18vw, 84px)',
      w: 'clamp(50px, 14vw, 60px)'
    };

    const lg = {
      min: 'clamp(200px, 60vw, 340px)',
      h: 'clamp(84px, 22vw, 110px)',
      w: 'clamp(60px, 18vw, 78px)'
    };

    const preset = size === 'sm' ? sm : (size === 'lg' ? lg : md);

    const root = document.documentElement;
    root.style.setProperty('--card-min', preset.min);
    root.style.setProperty('--card-thumb-h', preset.h);
    root.style.setProperty('--card-thumb-w', preset.w);

    // Grid columns are responsive via CSS; no forced column count.
  }, [size]);

  const value = useMemo(() => ({ size, setSize }), [size]);

  return (
    <CardSizeContext.Provider value={value}>{children}</CardSizeContext.Provider>
  );
}

export function useCardSize() {
  const ctx = useContext(CardSizeContext);
  if (!ctx) throw new Error('useCardSize must be used within CardSizeProvider');
  return ctx;
}
