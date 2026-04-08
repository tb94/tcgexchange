import { useEffect, useState } from 'react';

// Compute how many columns can fit in a container, capped by maxCols,
// while respecting a minimum tile width (minTilePx).
export function useAutoGridCols({ containerRef, maxCols = 3, minTilePx = 320, gapPx = 12 }) {
  const [cols, setCols] = useState(() => Math.max(1, Math.floor(maxCols)));

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return undefined;

    function recompute(width) {
      const max = Math.max(1, Math.floor(maxCols));
      const min = Math.max(160, Number(minTilePx) || 320);
      const gap = Math.max(0, Number(gapPx) || 0);

      // Fit formula: cols * min + (cols-1) * gap <= width
      const possible = Math.floor((width + gap) / (min + gap));
      const next = Math.min(max, Math.max(1, possible));
      setCols(next);
    }

    const ro = new ResizeObserver((entries) => {
      const w = entries?.[0]?.contentRect?.width;
      if (typeof w === 'number') recompute(w);
    });
    ro.observe(el);

    // initial
    recompute(el.getBoundingClientRect().width);

    return () => ro.disconnect();
  }, [containerRef, gapPx, maxCols, minTilePx]);

  return cols;
}
