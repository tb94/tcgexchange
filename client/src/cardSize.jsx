import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CardSizeContext = createContext(null);

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, Math.round(x)));
}

export function CardSizeProvider({ children }) {
  // 0..100 slider. We keep it numeric so we can scale smoothly from Small to XXL.
  const [scale, setScale] = useState(() => {
    const raw = localStorage.getItem('cardSizeScale');
    const n = Number(raw);
    // Default near prior "md".
    if (!Number.isFinite(n)) return 45;
    return clampInt(n, 0, 100);
  });

  useEffect(() => {
    localStorage.setItem('cardSizeScale', String(scale));

    // Mapping note:
    // We intentionally use direct px interpolation so slider endpoints map 1:1 visually:
    // scale=0 => true min size, scale=100 => true max size, scale=50 => midpoint size.
    const t = clamp01(scale / 100);

    const cardMinPx = Math.round(lerp(180, 320, t));
    const thumbHPx = Math.round(lerp(66, 120, t));
    const thumbWPx = Math.round(lerp(46, 90, t));

    const root = document.documentElement;
    root.style.setProperty('--card-min', `${cardMinPx}px`);
    root.style.setProperty('--card-thumb-h', `${thumbHPx}px`);
    root.style.setProperty('--card-thumb-w', `${thumbWPx}px`);
  }, [scale]);

  const minTilePx = useMemo(() => {
    const t = clamp01(scale / 100);
    return Math.round(lerp(180, 320, t));
  }, [scale]);

  const value = useMemo(() => ({ scale, setScale, minTilePx }), [scale, minTilePx]);

  return (
    <CardSizeContext.Provider value={value}>{children}</CardSizeContext.Provider>
  );
}

export function useCardSize() {
  const ctx = useContext(CardSizeContext);
  if (!ctx) throw new Error('useCardSize must be used within CardSizeProvider');
  return ctx;
}
