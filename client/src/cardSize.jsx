import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CardSizeContext = createContext(null);

export function CardSizeProvider({ children }) {
  const [size, setSize] = useState(() => localStorage.getItem('cardSize') || 'md');

  useEffect(() => {
    localStorage.setItem('cardSize', size);

    // Use clamp() so sizing adapts to phone vs desktop widths.
    // These are CSS strings intentionally (not numbers).
    // Bump all three sizes up while keeping roughly the same relative ratios.
    const sm = {
      min: 'clamp(180px, 48vw, 260px)',
      h: 'clamp(66px, 18vw, 78px)',
      w: 'clamp(46px, 14vw, 56px)'
    };

    const md = {
      min: 'clamp(210px, 54vw, 340px)',
      h: 'clamp(78px, 20vw, 100px)',
      w: 'clamp(56px, 16vw, 72px)'
    };

    const lg = {
      min: 'clamp(240px, 66vw, 420px)',
      h: 'clamp(96px, 26vw, 140px)',
      w: 'clamp(70px, 22vw, 100px)'
    };

    const preset = size === 'sm' ? sm : (size === 'lg' ? lg : md);

    const root = document.documentElement;
    root.style.setProperty('--card-min', preset.min);
    root.style.setProperty('--card-thumb-h', preset.h);
    root.style.setProperty('--card-thumb-w', preset.w);

    // Grid columns are responsive via CSS; no forced column count.
  }, [size]);

  const minTilePx = useMemo(() => {
    // Used for responsive grid column calculations (in JS). Keep this aligned with your chosen sizes.
    if (size === 'sm') return 260;
    // Note: JS uses a single numeric minimum for fit calculations.
    // Keep this a bit smaller than the CSS clamp() max so large cards can still fit 3-up on common desktop widths.
    if (size === 'lg') return 340;
    return 340;
  }, [size]);

  const value = useMemo(() => ({ size, setSize, minTilePx }), [size, minTilePx]);

  return (
    <CardSizeContext.Provider value={value}>{children}</CardSizeContext.Provider>
  );
}

export function useCardSize() {
  const ctx = useContext(CardSizeContext);
  if (!ctx) throw new Error('useCardSize must be used within CardSizeProvider');
  return ctx;
}
