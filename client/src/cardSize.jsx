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

    // Use clamp() so sizing adapts to phone vs desktop widths.
    // Interpolate between "Small" and "XXL" endpoints.
    const t = clamp01(scale / 100);

    const minMin = Math.round(lerp(180, 320, t));
    const minVw = lerp(48, 92, t).toFixed(1);
    const minMax = Math.round(lerp(260, 560, t));

    const thumbHMin = Math.round(lerp(66, 120, t));
    const thumbHVw = lerp(18, 34, t).toFixed(1);
    const thumbHMax = Math.round(lerp(78, 190, t));

    const thumbWMin = Math.round(lerp(46, 90, t));
    const thumbWVw = lerp(14, 28, t).toFixed(1);
    const thumbWMax = Math.round(lerp(56, 140, t));

    const preset = {
      min: `clamp(${minMin}px, ${minVw}vw, ${minMax}px)`,
      h: `clamp(${thumbHMin}px, ${thumbHVw}vw, ${thumbHMax}px)`,
      w: `clamp(${thumbWMin}px, ${thumbWVw}vw, ${thumbWMax}px)`,
    };

    const root = document.documentElement;
    root.style.setProperty('--card-min', preset.min);
    root.style.setProperty('--card-thumb-h', preset.h);
    root.style.setProperty('--card-thumb-w', preset.w);
  }, [scale]);

  const minTilePx = useMemo(() => {
    // Used for responsive grid column calculations (in JS).
    // Keep it a bit conservative vs CSS max so we don't overflow by a few px.
    const t = clamp01(scale / 100);
    const cssMax = lerp(260, 560, t);
    return Math.max(220, Math.round(cssMax * 0.86));
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
