import { useEffect, useState } from 'react';

// Compute how many columns can fit in a container, capped by maxCols,
// while respecting a minimum tile width (minTilePx).
export function useAutoGridCols({ containerRef, maxCols = 3, minTilePx = 320, gapPx = 12, safetyPx = 16 }) {
  const [cols, setCols] = useState(() => Math.max(1, Math.floor(maxCols)));

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return undefined;

    function recompute(width) {
      const max = Math.max(1, Math.floor(maxCols));
      const min = Math.max(160, Number(minTilePx) || 320);
      const gap = Math.max(0, Number(gapPx) || 0);
      const safety = Math.max(0, Number(safetyPx) || 0);

      // Fit formula: cols * min + (cols-1) * gap <= (width - safety)
      // safety accounts for rounding, scrollbars, and border/padding quirks.
      const available = Math.max(0, width - safety);
      const possible = Math.floor((available + gap) / (min + gap));
      const next = Math.min(max, Math.max(1, possible));
      setCols(next);
    }

    const ro = new ResizeObserver((entries) => {
      const w = entries?.[0]?.contentRect?.width;
      if (typeof w === 'number') recompute(w);
    });
    ro.observe(el);

    // initial (sometimes 0 on first paint)
    const initial = el.getBoundingClientRect().width;
    recompute(initial);

    // If width is 0 (layout not settled yet), retry a couple times.
    let tries = 0;
    let cancelled = false;
    function retry() {
      if (cancelled) return;
      tries += 1;
      const w = el.getBoundingClientRect().width;
      if (w > 0 || tries >= 5) {
        recompute(w);
        return;
      }
      window.requestAnimationFrame(retry);
    }
    if (initial === 0) window.requestAnimationFrame(retry);

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [containerRef, gapPx, maxCols, minTilePx]);

  return cols;
}
